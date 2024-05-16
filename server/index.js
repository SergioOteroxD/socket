import express from "express";
import logger from "morgan";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import { Server } from "socket.io";
import { createServer } from "node:http";

dotenv.config();

const message = [];

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

io.on("connection", async (socket) => {
  console.log("a user has connected!");

  socket.on("disconnect", () => {
    console.log("an user has disconnected");
  });

  socket.on("chat message", async (msg) => {
    const username = socket.handshake.auth.username ?? "anonymous";
    console.log({ username });
    const id = uuidv4();
    try {
      message.push({ msg, username, id });
    } catch (e) {
      console.error(e);
      return;
    }

    io.emit("chat message", msg, id, username);
  });

  if (!socket.recovered) {
    // <- recuperase los mensajes sin conexión
    try {
      message.forEach(function (elemento, indice, array) {
        console.log(elemento, indice);

        socket.emit(
          "chat message",
          elemento.msg,
          elemento.id.toString(),
          elemento.username
        );
      });
    } catch (e) {
      console.error(e);
    }
  }
});

app.use(logger("dev"));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
