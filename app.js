const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = socket(server);

let players = {};
let currentPlayer = "w";
const chess = new Chess();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "view/", "index.ejs"), {
    title: "Chess Game",
  });
});

io.on("connection", (uniqsocket) => {
  console.log("connected");

  if (!players.white) {
    players.white = uniqsocket.id;
    uniqsocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniqsocket.id;
    uniqsocket.emit("playerRole", "b");
  } else {
    uniqsocket.emit("spectatorRole");
  }

  uniqsocket.on("disconnect", () => {
    if (uniqsocket.id === players.white) {
      delete players.white;
    }
    if (uniqsocket.id === players.black) {
      delete players.black;
    }
  });

  uniqsocket.on("move", (move) => {
    try {
      // Debugging statements
      // console.log("Received move: ", move);
      // console.log("uniqsocket.id: ", uniqsocket.id);
      // console.log("players: ", players);
      // console.log("chess: ", chess);

      if (chess.turn() === "w" && uniqsocket.id !== players.white) return;
      if (chess.turn() === "b" && uniqsocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniqsocket.emit("invalidMove", move);
      }
    } catch (err) {
      console.log(err);
      uniqsocket.emit("invalidMove", move);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Listening to the port ${PORT}`);
});
