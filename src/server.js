require("dotenv").config();

const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const WebSocketLib = require("ws");
const { WebSocketServer } = WebSocketLib;

const { connectRedis } = require("./config/redis");
const { setCheckbox, getAllChecked } = require("./config/checkboxStore");
const { connectPubSub, publishUpdate, subscribeToUpdates } = require("./config/pubsub");
const { verifyToken } = require("./config/auth");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use("/api/auth", authRoutes);

const GRID_SIZE = 20;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

app.get("/api/state", async (req, res) => {
  const checkedCells = await getAllChecked(TOTAL_CELLS);
  res.json({ gridSize: GRID_SIZE, checkedCells });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function getTokenFromRequest(req) {
  const url = new URL(req.url, "http://localhost");
  return url.searchParams.get("token");
}

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocketLib.OPEN) client.send(msg);
  }
}

wss.on("connection", async (ws, req) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) { ws.close(4001, "Missing token"); return; }
    const payload = verifyToken(token);
    ws.user = payload;
    const checkedCells = await getAllChecked(TOTAL_CELLS);
    ws.send(JSON.stringify({ type: "init", gridSize: GRID_SIZE, checkedCells }));
  } catch (err) {
    ws.close(4002, "Invalid token");
    return;
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type !== "toggle") return;
      const index = Number(data.index);
      const checked = Boolean(data.checked);
      if (!Number.isInteger(index) || index < 0 || index >= TOTAL_CELLS) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid checkbox index" }));
        return;
      }
      await setCheckbox(index, checked);
      await publishUpdate({ type: "update", index, checked });
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });
});

async function startServer() {
  await connectRedis();
  await connectPubSub();
  await subscribeToUpdates((payload) => broadcast(payload));
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

startServer();