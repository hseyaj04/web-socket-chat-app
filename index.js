const express = require('express')
const { createServer} = require('node:http')
const { Server } = require('socket.io')
const {join} = require('node:path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')




async function main(){
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  })
  
  await db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_offset TEXT UNIQUE,
          content TEXT
      );
    `)
  
  const app = express()
  const server = createServer(app)
  const io = new Server(server, {connectionStateRecovery: {}})
  
  
  app.get('/', (req, res) => {
      res.sendFile(join(__dirname, 'index.html'));
  })
  
  
  io.emit('hello', 'world') //emits event to all connected sockets
  
  io.on('connection', async (socket) => {
      socket.on('chat message', async (msg, clientOffset, callback) => {
        let result;
        try {
          result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset)
        } catch (error) {
          if (error.errno === 19 /* SQLITE_CONSTRAINT */ ) {
            // the message was already inserted, so we notify the client
            callback();
          } else {
            // nothing to do, just let the client retry
          }
          return;
        }
        io.emit('chat message', msg, result.lastID);
        callback()
      });

      socket.on('connection message', async (msg) => {
        let result;
        try {
          result = await db.run('INSERT INTO messages (content) VALUES (?)', msg)
        } catch (error) {
          throw new Error(error);
        }
        io.emit('connection message', msg, result.lastID);
      });

      if (!socket.recovered) {
        // if the connection state recovery was not successful
        try {
          await db.each('SELECT id, content FROM messages WHERE id > ?',
            [socket.handshake.auth.serverOffset || 0],
            (_err, row) => {
              socket.emit('chat message', row.content, row.id);
            }
          )
        } catch (e) {
          throw new Error(e)
        }
      }
      });
  
  server.listen(3000, () => {
      console.log("listening at port http://localhost:3000");
  })
}

main();