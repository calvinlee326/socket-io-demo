const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

async function main() {
  // open the database file
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  // create our 'messages' table (if it does not exist)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_offset TEXT UNIQUE,
        author TEXT,
        content TEXT
    );
  `);

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    connectionStateRecovery: {},
    // use the Redis adapter
    adapter: await createRedisAdapter()
  });

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  io.on('connection', async (socket) => {
    socket.nickname = 'User-' + socket.id.slice(0, 4);

    // notify existing users
    socket.broadcast.emit('user event', `${socket.nickname} has connected`);

    socket.on('change nickname', (newNickname) => {
      const oldNickname = socket.nickname;
      socket.nickname = newNickname;
      socket.emit('nickname assigned', newNickname);
      io.emit('user event', `${oldNickname} is now known as ${newNickname}`);
    });

    socket.on('chat message', async (msg, clientOffset, callback) => {
      let result;
      try {
        // store the message in the database
        result = await db.run('INSERT INTO messages (content, client_offset, author) VALUES (?, ?, ?)', msg, clientOffset, socket.nickname);
      } catch (e) {
        if (e.errno === 19 /* SQLITE_CONSTRAINT */) {
          // the message was already inserted, so we notify the client
          callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      // include the offset with the message
      io.emit('chat message', msg, result.lastID, socket.nickname);
      // acknowledge the event
      callback();
    });

    socket.on('disconnect', () => {
      io.emit('user event', `${socket.nickname} has disconnected`);
    });

    if (!socket.recovered) {
      // if the connection state recovery was not successful
      try {
        await db.each('SELECT id, content, author FROM messages WHERE id > ?',
          [socket.handshake.auth.server_offset || 0],
          (_err, row) => {
            // pass a boolean to indicate if the message is from the current user
            socket.emit('chat message', row.content, row.id, row.author, row.author === socket.nickname);
          }
        )
      } catch (e) {
        // something went wrong
      }
    }

    // send the nickname to the client
    socket.emit('nickname assigned', socket.nickname);
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}

async function createRedisAdapter() {
  const pubClient = createClient({ url: 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  return createAdapter(pubClient, subClient);
}

main(); 