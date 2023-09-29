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

const message = [{
  id: 0,
  userMessage: 'Welcome to the chat, participate by starting a technological debate or following the one there is, thank you.',
  userNickName: 'Sam-botVirtual-EN',
}];

io.on("connection", (socket) => {
  console.log(`El cliente con IP: ${socket.handshake.address} se ha conectado`);
  socket.emit('messages', message);

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
    delete list_users[socket.nickname];
    io.emit("activeSessions", list_users);
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
