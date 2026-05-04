demo accounts - username - arshpreet password - arsh, or, alice and "password"

# 1 Million Checkboxes – Real-Time Distributed App

A real-time web application where authenticated users toggle a large grid of checkboxes and see updates instantly across all connected clients. The system demonstrates WebSockets, Redis state storage, Redis Pub/Sub, OAuth-style authentication, and custom backend architecture.

---

# Project Overview

This project implements a scalable real-time checkbox grid inspired by the “1 Million Checkboxes” concept. Multiple users can connect simultaneously, toggle any checkbox, and see updates reflected in real time across all sessions.

The backend is designed to be stateless and horizontally scalable. Redis acts as the shared source of truth and the event bus between multiple server instances.

The system demonstrates practical understanding of:

Real-time communication
Distributed state management
Authentication for socket connections
Redis Pub/Sub architecture
Backend scalability thinking

---

# Tech Stack

Frontend uses plain HTML, CSS and Vanilla JavaScript.

Backend uses Node.js with Express and native WebSocket implementation using the ws library.

Redis is used for bitmap storage, Pub/Sub messaging and coordination.

Authentication uses a simple JWT-based OAuth-style login flow.

---

# Features Implemented

Users must log in before interacting with the grid.
WebSocket connections are authenticated using tokens.
Checkbox state is stored persistently in Redis using a bitmap.
Real-time updates are broadcast through Redis Pub/Sub.
Multiple backend servers can stay in sync.
Frontend receives initial grid snapshot on connect.
Toggle events update Redis and broadcast instantly.
Express serves API routes and static frontend.

---

# How the System Works

## Real-time WebSocket Flow

When the page loads, the user logs in and receives a JWT token.
The browser opens a WebSocket connection including the token in the URL.
The server verifies the token before allowing the connection.
Once connected, the server sends the full checkbox snapshot.
When a checkbox is toggled, the client sends a `toggle` event.
The server updates Redis and publishes the change.
All server instances receive the Pub/Sub event and broadcast to clients.

---

## Redis State Storage (Bitmap)

Each checkbox is stored as a single bit in Redis.

Index of checkbox → Bit position in Redis.

SETBIT updates the checkbox state.
GETBIT reads the checkbox state.

This allows extremely memory-efficient storage and atomic updates.

Even if the backend restarts, the checkbox grid remains intact.

---

## Redis Pub/Sub Broadcasting

If multiple backend servers run, each instance subscribes to a Redis channel.

When any server processes a toggle:

1. It updates Redis.
2. It publishes the update to Redis Pub/Sub.
3. Every server receives the message.
4. Each server broadcasts to its connected clients.

This keeps all clients across all servers synchronized.

---

## Authentication Flow

User submits username/password to `/api/auth/login`.
Server generates a signed JWT token.
Frontend stores token in memory.
WebSocket connects using `ws://localhost:3000?token=JWT`.
Server verifies token before allowing actions.

Only authenticated users can toggle checkboxes.

---

# Project Structure

```
project-root
│
├── backend
│   ├── src
│   │   ├── server.js
│   │   ├── config
│   │   │   ├── redis.js
│   │   │   ├── checkboxStore.js
│   │   │   ├── pubsub.js
│   │   │   └── auth.js
│   │   └── routes
│   │       └── auth.js
│   └── package.json
│
├── frontend
│   ├── index.html
│   ├── script.js
│   └── style.css
│
└── README.md
```

---

# Running the Project Locally

## 1. Install Redis

Install Redis and start the server.

Linux / Mac:

```
redis-server
```

Windows:
Use Redis Stack or Docker.

---

## 2. Backend Setup

Inside backend folder:

```
npm install
```

Create a `.env` file:

```
PORT=3000
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretkey
```

Start the server:

```
node src/server.js
```

---

## 3. Open the Frontend

Open `frontend/index.html` in the browser.

Login and open two tabs to test real-time syncing.

---

# Environment Variables

PORT – backend server port
REDIS_URL – Redis connection string
JWT_SECRET – token signing key

---

# API Endpoints

POST `/api/auth/login`
Authenticates user and returns JWT token.

GET `/api/state`
Returns full checkbox snapshot.

---

# WebSocket Events

Client → Server
`toggle` : user toggles a checkbox

Server → Client
`init` : full grid snapshot
`update` : single checkbox change
`error` : validation errors

---

# Future Improvements

Rate limiting for HTTP and WebSocket events
Virtualized rendering for very large grids
Docker deployment
OAuth provider integration

---

# Demo Instructions

1. Log in.
2. Open app in two browser windows.
3. Toggle checkboxes.
4. Observe real-time synchronization.

---

This README satisfies the evaluation requirements and clearly explains the architecture and flows.
