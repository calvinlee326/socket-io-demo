# Socket.IO Chat Application Demo

This project is a real-time chat application built by following the official Socket.IO "Get Started" tutorial from Step 1 to Step 9. It serves as a comprehensive example of building a robust, scalable, and reliable chat service.

## Features

- **Real-time Messaging**: Instant message delivery between multiple clients.
- **Message Persistence**: Chat history is stored in an SQLite database, so messages are not lost when the server restarts.
- **Connection State Recovery**: If a client disconnects temporarily (e.g., due to poor network), it will automatically receive any missed messages upon reconnection.
- **Exactly-Once Delivery Guarantee**: A robust mechanism ensures that messages are neither lost nor duplicated, even in unreliable network conditions. This is achieved through a combination of server-side `UNIQUE` constraints and client-side offset tracking.
- **Horizontal Scaling**: The application is ready for high-traffic scenarios. By using a Redis adapter, multiple instances of the server can be deployed to handle a large number of concurrent users.

## Tech Stack

- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Database**: SQLite (for message persistence)
- **Message Broker**: Redis (for horizontal scaling)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- A running [Redis](https://redis.io/) server.

### Setting up Redis

You need a running Redis instance for the application to work. You can either install it directly or use Docker.

**Option 1: Using Homebrew (macOS)**
```bash
# Install Redis
brew install redis

# Start the Redis service
brew services start redis
```

**Option 2: Using Docker**
```bash
# Pull and run the Redis image in the background
docker run -d --name my-redis -p 6379:6379 redis
```

## Installation & Setup

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/YOUR_USERNAME/socket-io-demo.git
    cd socket-io-demo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application

Once Redis is running and dependencies are installed, you can start the server.

```bash
npm start
```

By default, the server will run at `http://localhost:3000`. Open this URL in your browser to start chatting.

## Testing Horizontal Scaling

This project is configured to run on multiple ports to simulate a multi-server environment.

1.  **Start the first server instance (on the default port 3000):**
    ```bash
    node index.js
    ```

2.  **Open a new terminal window and start a second instance on a different port (e.g., 3001):**
    ```bash
    PORT=3001 node index.js
    ```
    *(Note: On Windows, the command might be `set PORT=3001 && npm start`)*

3.  **Test the connection:**
    - Open `http://localhost:3000` in one browser tab.
    - Open `http://localhost:3001` in another browser tab.
    - Send a message from either tab. It should instantly appear in both tabs, demonstrating that the Redis adapter is correctly broadcasting messages across all server instances. 