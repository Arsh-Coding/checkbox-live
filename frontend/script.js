const GRID_SIZE = 20;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const loginForm = document.getElementById("login-form");
const API_BASE = "http://localhost:3000";

let socket = null;
let cellMap = new Map();
let suppressChange = false;

function setStatus(message, color) {
  statusEl.textContent = message;
  statusEl.style.color = color || "#111827";
}

async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

function buildGrid() {
  gridEl.innerHTML = "";
  cellMap = new Map();

  for (let index = 0; index < TOTAL_CELLS; index++) {
    const cell = document.createElement("input");
    cell.type = "checkbox";
    cell.className = "cell";
    cell.dataset.index = String(index);

    cell.addEventListener("change", () => {
      if (suppressChange) return;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setStatus("Not connected", "crimson");
        return;
      }

      socket.send(
        JSON.stringify({
          type: "toggle",
          index,
          checked: cell.checked,
        })
      );
    });

    gridEl.appendChild(cell);
    cellMap.set(index, cell);
  }
}

function applyInitialState(checkedCells) {
  suppressChange = true;
  for (const index of checkedCells) {
    const cell = cellMap.get(index);
    if (cell) {
      cell.checked = true;
    }
  }
  suppressChange = false;
}

function updateCell(index, checked) {
  const cell = cellMap.get(index);
  if (!cell) return;

  suppressChange = true;
  cell.checked = checked;
  suppressChange = false;
}

function connectSocket(token) {
  if (!token) {
    setStatus("Missing token", "crimson");
    return;
  }

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/?token=${encodeURIComponent(token)}`;
  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    setStatus("Connected", "green");
  });

  socket.addEventListener("close", (event) => {
    if (event.code === 4001) {
      setStatus("Disconnected: missing token", "crimson");
    } else if (event.code === 4002) {
      setStatus("Disconnected: invalid token", "crimson");
    } else {
      setStatus("Disconnected", "crimson");
    }
    socket = null;
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "init") {
        applyInitialState(data.checkedCells || []);
        return;
      }

      if (data.type === "update") {
        updateCell(Number(data.index), Boolean(data.checked));
        return;
      }

      if (data.type === "error") {
        setStatus(data.message || "Server error", "crimson");
      }
    } catch (error) {
      console.error("Invalid message", error);
    }
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  setStatus("Logging in...", "#4b5563");

  try {
    const result = await login(username, password);
    localStorage.setItem("token", result.token);
    setStatus("Logged in", "green");
    connectSocket(result.token);
  } catch (error) {
    setStatus("Login failed", "crimson");
    console.error(error);
  }
});

buildGrid();

const savedToken = localStorage.getItem("token");
if (savedToken) {
  connectSocket(savedToken);
} else {
  setStatus("Please log in to continue.", "#4b5563");
}

fetch(`${API_BASE}/api/state`)
  .then((response) => response.json())
  .then((state) => {
    if (Array.isArray(state.checkedCells)) {
      applyInitialState(state.checkedCells);
    }
  })
  .catch(() => {});