//import express and http to create server
const express = require('express');
const http = require('http');

const cors = require('cors');
const jwt = require('jsonwebtoken');

//socket io server
const { Server } = require('socket.io');

//config.js
const CONFIG = require('./config');

const app = express();
const server = http.createServer(app);

const port = process.env.port || CONFIG.port;

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

//socket variables
let users = {}
let rooms = {} //multiple chat rooms

//restful
app.get('/', (req, res) => {
    res.send('Hello, Chat server');
})

//authentication
app.post('/login', (req, res) => {
    const { username } = req.body;

    console.log(username)

    if (!username) {
        return res.status(400).json({
            error: "Username is required!"
        })
    }

    const token = jwt.sign({ username }, CONFIG.SECRET_KEY, { expiresIn: 3600 });

    res.json({
        token, username
    })
})

//middleware to authenticate
io.use((socket, next) => {

    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authencation error"));
    }

    jwt.verify(token, CONFIG.SECRET_KEY, (err, decoded) => {
        if (err) return next(new Error("Authentication error"));

        socket.username = decoded.username;
        next();
    })

})

//socket io usage
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username}`);

    users[socket.id] = socket.username;

    //join
    socket.on('join', (room) => {
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = [];
        }

        console.log(room)

        io.to(room).emit("history", rooms[room]);
        io.to(room).emit("new user joined", socket.username);
    })

    //chat
    socket.on('send', (data) => {
        const { room, content } = data;
        console.log(data);

        const msg = {
            username: socket.username,
            content,
            time: new Date().toLocaleDateString()
        }

        rooms[room].push(msg)
        console.log(rooms);
        io.to(room).emit('receive', msg);
    })

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.username}`);
        //when user disconnect, delete the user from users
        delete users[socket.id];
    })
})


server.listen(port, () => {
    console.log(`Server is running on port : ${port}`)
})