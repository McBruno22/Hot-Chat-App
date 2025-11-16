const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

console.log("server.js a fost pornit!");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// servim folderul Public (cu P mare)
app.use(express.static(path.join(__dirname, "Public")));

// fișierul în care salvăm mesajele
const MESSAGES_FILE = path.join(__dirname, "messages.json");

// încărcăm mesajele din fișier (dacă există)
let messages = [];
try {
  if (fs.existsSync(MESSAGES_FILE)) {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf8");
    if (raw.trim()) {
      messages = JSON.parse(raw);
      console.log(`Am încărcat ${messages.length} mesaje din messages.json`);
    }
  }
} catch (err) {
  console.error("Eroare la citirea messages.json:", err.message);
  messages = [];
}

// funcție de salvare pe disc
function saveMessagesToFile() {
  fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), (err) => {
    if (err) {
      console.error("Eroare la salvarea messages.json:", err.message);
    }
  });
}

// endpoint pentru pagina de admin – trimite toate mesajele ca JSON
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

// WebSocket / Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilizator s-a conectat:", socket.id);

  // trimitem istoricul doar la user-ul care tocmai a intrat
  socket.emit("chatHistory", messages);

  socket.on("chatMessage", (msgObj) => {
    const now = new Date();

    const fullMsg = {
      id: socket.id,
      name: msgObj.name || "Anonim",
      text: msgObj.text,
      date: now.toLocaleDateString("ro-RO"), // ex: 16.11.2025
      time: now.toLocaleTimeString("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: now.toISOString(), // format tehnic, util la nevoie
    };

    messages.push(fullMsg);

    // limităm istoricul la ultimele 500 mesaje
    if (messages.length > 500) {
      messages.shift();
    }

    saveMessagesToFile();

    io.emit("chatMessage", fullMsg);
  });

  socket.on("disconnect", () => {
    console.log("Utilizator deconectat:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Serverul ruleaza pe http://localhost:${PORT}`);
});
