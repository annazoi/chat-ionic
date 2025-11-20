import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { API_URL } from '../constants';

export const useSocket = () => {
	const [socket, setSocket] = useState<any>();
	useEffect(() => {
		const s = io(`${API_URL}`);
		console.log('Socket connected');
		setSocket(s);

		return () => {
			s.disconnect();
			console.log('Socket disconnected');
		};
	}, []);

	return {
		socket,
	};
};
