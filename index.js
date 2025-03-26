const express = require('express')
const { createServer} = require('node:http')
const { Server } = require('socket.io')

const app = express()

const server = createServer(app)


app.get('/', (req, res) => {
    res.send("hello chat");
})



server.listen(3000, () => {
    console.log("listening at port http://localhost:3000");
})