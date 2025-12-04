const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv/config');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const formidable = require('express-formidable');
// Import the Routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/users');
const chatRoutes = require('../routes/chat');
const bodyParser = require('body-parser');
const multer = require('multer');
const http = require('http').Server(app);
const io = require('socket.io');
const { Socket } = require('dgram');
const e = require('express');
// const port = process.env.PORT || "8100";

// app.use(formidable());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		// limit: "50mb",
		extended: true,
	})
);
app.use(cors());

// Import the Routes
app.get('/', (req, res) => res.send('Hello express'));
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);

mongoose.connect(process.env.DB_CONNECTION).then(() => {
	http.listen(3000, () => {
		console.log(`Server listening at ${process.env.PORT}`);
	});
});

const socket = io(http, {
	cors: {
		origin: process.env.PORT,
		methods: ['GET', 'POST'],
	},
});

socket.on('connection', (socket) => {
	console.log(`user connected: ${socket.id}`);

	socket.on('join_room', (data) => {
		socket.join(data);
		console.log(`user with id: ${socket.id} joined room: ${data}`);

		socket.on('send_message', (data) => {
			// socket.in(data.room).emit("receive_message", data);
			// const data = {
			//   username: data.senderId.username,
			//   message: data.message,
			//   avatar: data.senderId.avatar,
			//   createdAt: data.createdAt,
			// };
			socket.to(data.room).emit('receive_message', data);
			console.log('receive_message', data);
		});

		// Join video call room
		socket.on('join_video', (roomId) => {
			socket.join(roomId);
			console.log(`User ${socket.id} joined video room: ${roomId}`);
		});

		// Send WebRTC offer
		socket.on('webrtc_offer', (data) => {
			console.log('Sending offer:', data);
			socket.to(data.roomId).emit('webrtc_offer', {
				sdp: data.sdp,
				sender: socket.id,
			});
		});

		// Send WebRTC answer
		socket.on('webrtc_answer', (data) => {
			console.log('Sending answer:', data);
			socket.to(data.roomId).emit('webrtc_answer', {
				sdp: data.sdp,
				sender: socket.id,
			});
		});

		// ICE Candidate exchange
		socket.on('webrtc_ice_candidate', (data) => {
			console.log('Sending ICE candidate:', data);
			socket.to(data.roomId).emit('webrtc_ice_candidate', {
				candidate: data.candidate,
				sender: socket.id,
			});
		});

		// VIDEO CALL SIGNALING
		socket.on('video_call_user', ({ roomId, fromUser }) => {
			socket.to(roomId).emit('incoming_video_call', { roomId, fromUser });
		});

		socket.on('video_call_accept', ({ roomId }) => {
			socket.to(roomId).emit('video_call_accepted');
		});

		socket.on('video_call_reject', ({ roomId }) => {
			socket.to(roomId).emit('video_call_rejected');
		});

		socket.on('video_call_end', ({ roomId }) => {
			socket.to(roomId).emit('video_call_ended');
		});

		// Audio Call
		socket.on('call_user', ({ roomId, fromUser }) => {
			socket.to(roomId).emit('incoming_call', {
				roomId,
				fromUser: {
					_id: fromUser._id,
					username: fromUser.username,
					avatar: fromUser.avatar,
				},
			});
		});
		// Accept call
		socket.on('accept_call', ({ roomId }) => {
			socket.to(roomId).emit('call_accepted');
		});

		// Reject call
		socket.on('reject_call', ({ roomId }) => {
			socket.to(roomId).emit('call_rejected');
		});

		socket.on('end_call', ({ roomId }) => {
			socket.to(roomId).emit('call_ended');
		});
	});

	socket.on('disconnect', () => {
		console.log('user disconnected', socket.id);
	});

	socket.on('connect_error', (err) => {
		console.log(`connect_error due to ${err.message}`);
	});
});

module.exports = app;
