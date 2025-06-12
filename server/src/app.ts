import express from 'express';
import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();

app.use(cors()); // Habilita CORS para permitir peticiones cross-origin

const server = createServer(app);

// Creamos el servidor de Socket.IO con recuperación de estado de conexión habilitada
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    connectionStateRecovery: {},
});

// Tipamos el objeto que representa los datos del mensaje
interface MessageData {
    room: string;
    author: string;
    message: string;
    time: string;
}

io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("send_message", (data: MessageData) => {
        console.log(data);
        socket.to(data.room).emit("recieve_message", data);
    });

    socket.on("join_room", (roomId: string) => {
        socket.join(roomId);
        console.log(`User with ID: ${socket.id} joined room: ${roomId}`);
    });

    socket.on('register_user', (username: string) => {
    socket.data.username = username;

    // Notificar a todos los demás usuarios que se ha conectado un usuario
    socket.broadcast.emit('user_connected', {
        message: `El usuario ${username} se ha conectado.`,
        username: username
    });
});

    socket.on("join_room", (data: {roomId: string, username: string}) => {
    socket.join(data.roomId);
    console.log(`User with ID: ${socket.id} (${data.username}) joined room: ${data.roomId}`);
    // Notifica al resto de usuarios de la sala
    socket.to(data.roomId).emit("user_joined", { username: data.username, room: data.roomId });
});
});

server.listen(3001, () => {
    console.log("Server is running on port 3001");
});
