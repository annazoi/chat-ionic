const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const chatRoutes = require('../routes/chat');

const http = require('http').createServer(app);
const { Server } = require('socket.io');

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
	cors({
		origin: ['http://localhost:5173', 'https://chat-ionic.vercel.app'],
		methods: ['GET', 'POST'],
		credentials: true,
	})
);

app.get('/', (req, res) => res.send('Hello express'));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);

mongoose.connect(process.env.DB_CONNECTION).then(() => {
	http.listen(3000, () => {
		console.log(`Server is running`);
	});
});

const io = new Server(http, {
	cors: {
		origin: ['http://localhost:5173', 'https://chat-ionic.vercel.app'],
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

io.on('connection', (socket) => {
	console.log('user connected', socket.id);

	socket.on('join_room', (room) => {
		socket.join(room);
		console.log(`User ${socket.id} joined room: ${room}`);
	});

	socket.on('send_message', (data) => {
		io.to(data.room).emit('receive_message', data);
	});

	socket.on('disconnect', () => {
		console.log('user disconnected', socket.id);
	});
});

module.exports = app;
