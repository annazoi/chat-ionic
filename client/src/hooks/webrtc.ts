import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

export interface IncomingCallData {
	fromUser: {
		_id: string;
		username: string;
		avatar?: string;
	};
	type: 'audio' | 'video';
}

interface WebRTCOfferPayload {
	roomId: string;
	sdp: RTCSessionDescriptionInit;
	type: 'audio' | 'video';
}

interface WebRTCAnswerPayload {
	roomId: string;
	sdp: RTCSessionDescriptionInit;
	type?: 'audio' | 'video';
}

interface IceCandidatePayload {
	roomId: string;
	candidate: RTCIceCandidateInit;
}

interface UseWebRTCProps {
	socket: Socket | null;
	roomId: string;
	localUserId: string;
	remoteUserId: string;
	ringtoneSrc: string;
}

export const useWebRTC = ({ socket, roomId, localUserId, remoteUserId, ringtoneSrc }: UseWebRTCProps) => {
	const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
	const [isCaller, setIsCaller] = useState(false);
	const [inCall, setInCall] = useState(false);
	const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);
	const ringtoneRef = useRef<HTMLAudioElement | null>(null);

	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
	const localAudioRef = useRef<HTMLAudioElement | null>(null);
	const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		if (socket && roomId) {
			console.log('JOINING ROOM (WEBRTC):', roomId);
			socket.emit('join_room', roomId);
			socket.emit('join_video', roomId);
		}
	}, [socket, roomId]);

	// ---------- RINGTONE ----------
	useEffect(() => {
		ringtoneRef.current = new Audio(ringtoneSrc);
		ringtoneRef.current.loop = true;
	}, [ringtoneSrc]);

	const startRingtone = () => {
		try {
			ringtoneRef.current?.play();
		} catch (e) {
			console.warn('Ringtone play error', e);
		}
	};

	const stopRingtone = () => {
		if (!ringtoneRef.current) return;
		ringtoneRef.current.pause();
		ringtoneRef.current.currentTime = 0;
	};

	// ---------- PEER CONNECTION ----------
	const createPeerConnection = () => {
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		});

		pc.ontrack = (event: RTCTrackEvent) => {
			const remoteStream = event.streams[0];
			if (!remoteStream) return;

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = remoteStream;
			}
			if (remoteAudioRef.current) {
				remoteAudioRef.current.srcObject = remoteStream;
			}
		};

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				console.log('📤 sending ICE:', event.candidate);

				socket?.emit('webrtc_ice_candidate', {
					roomId,
					candidate: event.candidate,
				});
			}
		};

		return pc;
	};

	// ---------- START CALL (caller) ----------
	const startCall = async (type: 'audio' | 'video') => {
		if (!socket || !roomId) return;

		setCallType(type);
		setIsCaller(true);
		setInCall(true);
		setIncomingCall(null);
		setIsMicMuted(false);

		startRingtone(); // ο caller ακούει ringtone μέχρι να γίνει accept/reject

		const constraints: MediaStreamConstraints =
			type === 'audio' ? { audio: true } : { audio: true, video: { facingMode } };

		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		if (type === 'video' && localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
		if (type === 'audio' && localAudioRef.current) {
			localAudioRef.current.srcObject = stream;
		}

		pcRef.current = createPeerConnection();
		stream.getTracks().forEach((track) => {
			pcRef.current?.addTrack(track, stream);
		});

		const offer = await pcRef.current!.createOffer();
		await pcRef.current!.setLocalDescription(offer);

		const payload: WebRTCOfferPayload = {
			roomId,
			sdp: offer,
			type,
		};

		socket.emit('webrtc_offer', payload);

		// σηματοδοσία κλήσης (popup στον άλλο)
		socket.emit(type === 'audio' ? 'call_user' : 'video_call_user', {
			roomId,
			fromUser: { _id: localUserId }, // στο backend το συμπληρώνεις αν θες παραπάνω
		});
	};

	// ---------- ACCEPT CALL (callee) ----------
	const acceptCall = async () => {
		if (!incomingCall || !socket) return;

		stopRingtone(); // σταματάει το ringtone στον callee

		const type = incomingCall.type;
		setCallType(type);
		setIsCaller(false);
		setInCall(true);
		setIsMicMuted(false);

		const constraints: MediaStreamConstraints =
			type === 'audio' ? { audio: true } : { audio: true, video: { facingMode } };

		// 1️⃣ ΠΡΩΤΑ φτιάχνουμε local stream
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		// 2️⃣ Δείχνουμε local
		if (type === 'video' && localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
		if (type === 'audio' && localAudioRef.current) {
			localAudioRef.current.srcObject = stream;
		}

		// 3️⃣ Φτιάχνουμε PC αν δεν υπάρχει
		if (!pcRef.current) pcRef.current = createPeerConnection();

		stream.getTracks().forEach((track) => {
			pcRef.current?.addTrack(track, stream);
		});

		// 4️⃣ Στέλνουμε accept στο άλλο άκρο
		socket.emit(type === 'audio' ? 'accept_call' : 'video_call_accept', { roomId });

		setIncomingCall(null);
	};

	// ---------- REJECT CALL ----------
	const rejectCall = () => {
		if (!incomingCall || !socket) return;

		stopRingtone();

		socket.emit(incomingCall.type === 'audio' ? 'reject_call' : 'video_call_reject', { roomId });

		setIncomingCall(null);
		setCallType(null);
	};

	// ---------- END CALL (και για τους δύο) ----------
	const endCall = (notify = true) => {
		stopRingtone();

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((t) => t.stop());
			localStreamRef.current = null;
		}

		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}

		if (notify && socket && callType) {
			socket.emit(callType === 'audio' ? 'end_call' : 'video_call_end', { roomId });
		}

		setInCall(false);
		setCallType(null);
		setIncomingCall(null);
		setIsCaller(false);
	};

	// ---------- MUTE ----------
	const toggleMute = () => {
		setIsMicMuted((prev) => {
			localStreamRef.current?.getAudioTracks().forEach((t) => {
				t.enabled = prev; // αντιστρέφουμε
			});
			return !prev;
		});
	};

	// ---------- FLIP CAMERA ----------
	const flipCamera = async () => {
		if (!localStreamRef.current || callType !== 'video' || !pcRef.current) return;

		const newMode = facingMode === 'user' ? 'environment' : 'user';
		setFacingMode(newMode);

		const stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: newMode },
			audio: true,
		});

		const newVideoTrack = stream.getVideoTracks()[0];

		const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');

		if (sender) {
			await sender.replaceTrack(newVideoTrack);
		}

		// σταματάμε τα παλιά tracks
		localStreamRef.current.getTracks().forEach((t) => t.stop());
		localStreamRef.current = stream;

		if (localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
	};

	// ---------- SOCKET EVENTS ----------
	useEffect(() => {
		if (!socket) return;

		const onIncomingCall = (data: IncomingCallData) => {
			setIncomingCall(data);
			startRingtone(); // ο callee ακούει μέχρι accept/reject
		};

		const onOffer = async (data: WebRTCOfferPayload) => {
			console.log('📩 webrtc_offer', data);

			if (!pcRef.current) {
				pcRef.current = createPeerConnection();
			}

			await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

			const answer = await pcRef.current.createAnswer();
			await pcRef.current.setLocalDescription(answer);

			const payload: WebRTCAnswerPayload = {
				roomId,
				sdp: answer,
				type: data.type,
			};

			socket.emit('webrtc_answer', payload);
		};

		const onAnswer = async (data: WebRTCAnswerPayload) => {
			console.log('📩 webrtc_answer', data);
			if (!pcRef.current) return;
			await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
			// εδώ ΕΠΙΣΗΣ θα μπορούσες να κάνεις stopRingtone για extra safety
		};

		const onIceCandidate = async (data: IceCandidatePayload) => {
			if (data.candidate && pcRef.current) {
				try {
					await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
				} catch (err) {
					console.error('Error adding ICE candidate', err);
				}
			}
		};

		const onCallAccepted = () => {
			console.log('📞 call_accepted');
			// Ο CALLER σταματάει ringtone εδώ
			stopRingtone();
		};

		const onVideoCallAccepted = () => {
			console.log('📹 video_call_accepted');
			stopRingtone();
		};

		const onCallRejected = () => {
			console.log('📞 call_rejected');
			stopRingtone();
			endCall(false);
		};

		const onVideoCallRejected = () => {
			console.log('📹 video_call_rejected');
			stopRingtone();
			endCall(false);
		};

		const onCallEnded = () => {
			console.log('📞 call_ended');
			endCall(false);
		};

		const onVideoCallEnded = () => {
			console.log('📹 video_call_ended');
			endCall(false);
		};

		socket.on('incoming_call', onIncomingCall);
		socket.on('incoming_video_call', onIncomingCall);
		socket.on('webrtc_offer', onOffer);
		socket.on('webrtc_answer', onAnswer);
		socket.on('webrtc_ice_candidate', onIceCandidate);

		socket.on('call_accepted', onCallAccepted);
		socket.on('video_call_accepted', onVideoCallAccepted);
		socket.on('call_rejected', onCallRejected);
		socket.on('video_call_rejected', onVideoCallRejected);
		socket.on('call_ended', onCallEnded);
		socket.on('video_call_ended', onVideoCallEnded);

		return () => {
			socket.off('incoming_call', onIncomingCall);
			socket.off('incoming_video_call', onIncomingCall);
			socket.off('webrtc_offer', onOffer);
			socket.off('webrtc_answer', onAnswer);
			socket.off('webrtc_ice_candidate', onIceCandidate);

			socket.off('call_accepted', onCallAccepted);
			socket.off('video_call_accepted', onVideoCallAccepted);
			socket.off('call_rejected', onCallRejected);
			socket.off('video_call_rejected', onVideoCallRejected);
			socket.off('call_ended', onCallEnded);
			socket.off('video_call_ended', onVideoCallEnded);
		};
	}, [socket, roomId, facingMode]);

	return {
		// state
		callType,
		isCaller,
		inCall,
		incomingCall,
		isMicMuted,

		// refs
		localVideoRef,
		remoteVideoRef,
		localAudioRef,
		remoteAudioRef,

		// actions
		startCall,
		acceptCall,
		rejectCall,
		endCall,
		toggleMute,
		flipCamera,
	};
};
