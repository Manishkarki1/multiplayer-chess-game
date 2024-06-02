const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = "";

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareindex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareindex) % 2 === 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareindex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerHTML = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (event) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareindex };
            event.dataTransfer.setData("text/plain", "");
          }
        });
        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });
        squareElement.appendChild(pieceElement);
      }
      squareElement.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      squareElement.addEventListener("drop", (event) => {
        event.preventDefault();
        if (draggedPiece) {
          const targetSource = {
            row: +squareElement.dataset.row,
            col: +squareElement.dataset.col,
          };
          handleMove(sourceSquare, targetSource);
        }
      });
      boardElement.appendChild(squareElement);
    });
    if (playerRole === "b") {
      boardElement.classList.add("flipped");
    } else {
      boardElement.classList.remove("flipped");
    }
  });
};
const handleMove = (source, target) => {
  const move = {
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q",
  };
  socket.emit("move", move);
};
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    p: "♟",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };
  return unicodePieces[piece.type] || "";
};
socket.on("playerRole", function (role) {
  playerRole = role;
  renderBoard();
});
socket.on("spectableRole", function () {
  playerRole = null;
  renderBoard();
});
socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});
socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});
socket.on("invalidMove", function (move) {
  alert(move);
  renderBoard();
});
renderBoard();
