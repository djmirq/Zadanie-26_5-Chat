const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const UsersService = require("./UsersService"); //import modułu

const usersService = new UsersService(); //tworzenie instancji klasy

app.use(express.static(`${__dirname}/public`));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

io.on("connection", socket => {
  // klient nasłuchuje na wiadomość wejścia do czatu
  socket.on("join", name => {
    // użytkownika, który pojawił się w aplikacji, zapisujemy do serwisu trzymającego listę osób w czacie
    usersService.addUser({
      id: socket.id,
      name
    });
    // aplikacja emituje zdarzenie update, które aktualizuje informację na temat listy użytkowników każdemu nasłuchującemu na wydarzenie 'update'
    io.emit("update", {
      users: usersService.getAllUsers() //aktualizacja użytkowników
    });
  });

  //funkja wykona się po utraceniu połączenia klienta z serwerem (po zamknięciu czatu przez użytkownika)
  socket.on("disconnect", () => {
    usersService.removeUser(socket.id);
    socket.broadcast.emit("update", {
      //ostatnia wiadomość do wszystkich tylko nie do siebie
      users: usersService.getAllUsers() //aktualizacja użytkowników
    });
  });

  //obsługa wysłania wiadomości do użytkowników
  socket.on("message", message => {
    const { name } = usersService.getUserById(socket.id);
    socket.broadcast.emit("message", {
      text: message.text,
      from: name
    });
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
