const express = require('express')
const { createServer} = require('node:http')
const { Server } = require('socket.io')
const {join} = require('node:path')



const app = express()
const server = createServer(app)
const io = new Server(server)


app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
})



io.emit('hello', 'world') //emits event to all connected sockets

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });

server.listen(3000, () => {
    console.log("listening at port http://localhost:3000");
})