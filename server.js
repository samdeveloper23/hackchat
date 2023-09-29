const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const morgan = require('morgan');
const colors = require('colors');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const PORT = 6677;
const list_users = {};

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const corsOptions = {
  origin: 'http://eva00.sytes.net',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // Aplica CORS a tu aplicación Express

app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload());

app.use(express.static(path.join(__dirname, "views")));

app.get('/', (req, res, next) => {
  try {
    const filePath = path.join(__dirname, 'views/index.html');
    res.sendFile(filePath);

  } catch (error) {
    next(error);
  }
});

io.on("connection", (socket) => {

  console.log(`El cliente con IP: ${socket.handshake.address} se ha conectado`);

  // Emitir un mensaje cuando un usuario se conecta
  io.emit("sendMessage", {
    message: `${socket.nickname} se ha unido al chat`,
    user: "System",
  });

  // Registrar automáticamente al usuario "samvirtual"
  socket.emit("register", "Sam-virtualBot-EN");
  // Emitir un mensaje de bienvenida desde "samvirtual" a todos los usuarios
  socket.emit("sendMessage", {
    message: "Welcome to the chat, participate by starting a technological debate or following the one there is, thank you.",
    user: "Sam-virtualBot-EN",
  });

  socket.emit("register", "Sam-virtualBot-ES");
  // Emitir un mensaje de bienvenida desde "samvirtual" a todos los usuarios
  socket.emit("sendMessage", {
    message: "Bienvenido al chat, participa iniciando un debate tecnológico o siguiendo el que haya, gracias.",
    user: "Sam-virtualBot-ES",
  });

  socket.emit("register", "INFO");
  // Emitir un mensaje de bienvenida desde "samvirtual" a todos los usuarios
  socket.emit("sendMessage", {
    message: "SE INFORMA: esta App es solo de pruebas, el objetivo es mejorar el servidor y la App, ahora mismo se esta trabajando con la DB, gracias.",
    user: "INFO",
  });

  socket.on("register", (nickname) => {
    if (list_users[nickname]) {
      socket.emit("userExists");
      return;
    } else {
      list_users[nickname] = socket.id;
      socket.nickname = nickname;
      socket.emit("login");
      io.emit("activeSessions", list_users);
    }
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      // Emitir un mensaje cuando un usuario se desconecta
      io.emit("sendMessage", {
        message: `${socket.nickname} se ha desconectado`,
        user: "System",
      });

      delete list_users[socket.nickname];
      io.emit("activeSessions", list_users);
    }
  });

  socket.on("sendMessage", ({ message, image }) => {
    io.emit("sendMessage", { message, user: socket.nickname, image });
  });

  socket.on("sendMessagesPrivate", ({ message, image, selectUser }) => {
    if (list_users[selectUser]) {
      io.to(list_users[selectUser]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
      io.to(list_users[socket.nickname]).emit("sendMessage", {
        message,
        user: socket.nickname,
        image,
      });
    } else {
      alert("El usuario al que intentas enviar el mensaje no existe!");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listen: ${PORT}`);
});
