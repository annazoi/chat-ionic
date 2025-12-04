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
	// ----------- STATE -----------
	const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
	const callTypeRef = useRef<'audio' | 'video' | null>(null);

	const [isCaller, setIsCaller] = useState(false);
	const [inCall, setInCall] = useState(false);
	const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
	const [isMicMuted, setIsMicMuted] = useState(false);
	const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

	// ----------- REFS -----------
	const pcRef = useRef<RTCPeerConnection | null>(null);
	const localStreamRef = useRef<MediaStream | null>(null);

	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
	const localAudioRef = useRef<HTMLAudioElement | null>(null);
	const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

	const ringtoneRef = useRef<HTMLAudioElement | null>(null);

	// ----------- AUDIO SETTINGS (Studio Quality) -----------
	const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
		audio: {
			echoCancellation: { ideal: true },
			noiseSuppression: { ideal: true },
			autoGainControl: { ideal: true },
			channelCount: 1,
			sampleRate: 48000,
			sampleSize: 16,
		},
	};

	const VIDEO_CONSTRAINTS = (facing: 'user' | 'environment') => ({
		audio: AUDIO_CONSTRAINTS.audio,
		video: {
			width: { ideal: 1280 },
			height: { ideal: 720 },
			frameRate: { ideal: 30 },
			facingMode: facing,
		},
	});

	// ----------- JOIN ROOM -----------
	useEffect(() => {
		if (socket && roomId) {
			socket.emit('join_room', roomId);
			socket.emit('join_video', roomId);
		}
	}, [socket, roomId]);

	// ----------- RINGTONE SETUP -----------
	useEffect(() => {
		ringtoneRef.current = new Audio(ringtoneSrc);
		ringtoneRef.current.loop = true;
	}, [ringtoneSrc]);

	const startRingtone = () => {
		try {
			ringtoneRef.current?.play();
		} catch {}
	};

	const stopRingtone = () => {
		if (!ringtoneRef.current) return;
		ringtoneRef.current.pause();
		ringtoneRef.current.currentTime = 0;
	};

	// ----------- PEER CONNECTION FACTORY -----------
	const createPeerConnection = () => {
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		});

		pc.ontrack = (event) => {
			console.log('🎥 ontrack fired:', event.streams);

			const remoteStream = event.streams[0];
			if (!remoteStream) return;

			if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;

			if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
		};

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				socket?.emit('webrtc_ice_candidate', {
					roomId,
					candidate: event.candidate,
				});
			}
		};

		pc.onconnectionstatechange = () => {
			console.log('🔗 PC state:', pc.connectionState);
		};

		return pc;
	};

	// ----------- START CALL (CALLER) -----------
	const startCall = async (type: 'audio' | 'video') => {
		if (!socket || !roomId) return;

		callTypeRef.current = type;
		setCallType(type);
		setIsCaller(true);
		setInCall(true);
		setIncomingCall(null);

		startRingtone();

		const constraints = type === 'audio' ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS(facingMode);

		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		if (type === 'video' && localVideoRef.current) localVideoRef.current.srcObject = stream;

		if (type === 'audio' && localAudioRef.current) localAudioRef.current.srcObject = stream;

		pcRef.current = createPeerConnection();

		stream.getTracks().forEach((track) => {
			pcRef.current!.addTrack(track, stream);
		});

		const offer = await pcRef.current!.createOffer();
		await pcRef.current!.setLocalDescription(offer);

		socket.emit('webrtc_offer', {
			roomId,
			sdp: offer,
			type,
		});

		socket.emit(type === 'audio' ? 'call_user' : 'video_call_user', {
			roomId,
			fromUser: { _id: localUserId },
		});
	};

	// ----------- ACCEPT CALL (CALLEE) -----------
	const acceptCall = async () => {
		if (!incomingCall || !socket) return;

		stopRingtone();

		const type = incomingCall.type;
		callTypeRef.current = type;
		setCallType(type);
		setInCall(true);
		setIsCaller(false);

		const constraints = type === 'audio' ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS(facingMode);

		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		if (type === 'video' && localVideoRef.current) localVideoRef.current.srcObject = stream;

		if (type === 'audio' && localAudioRef.current) localAudioRef.current.srcObject = stream;

		if (!pcRef.current) pcRef.current = createPeerConnection();

		stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));

		socket.emit(type === 'audio' ? 'accept_call' : 'video_call_accept', { roomId });

		setIncomingCall(null);
	};

	// ----------- REJECT CALL -----------
	const rejectCall = () => {
		if (!incomingCall || !socket) return;

		stopRingtone();

		socket.emit(incomingCall.type === 'audio' ? 'reject_call' : 'video_call_reject', { roomId });

		setIncomingCall(null);
		setCallType(null);
		callTypeRef.current = null;
	};

	// ----------- END CALL -----------
	const endCall = (notify = true) => {
		stopRingtone();

		const type = callTypeRef.current;

		if (notify && socket && type) {
			socket.emit(type === 'audio' ? 'end_call' : 'video_call_end', { roomId });
		}

		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((t) => t.stop());
			localStreamRef.current = null;
		}

		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}

		setInCall(false);
		setCallType(null);
		callTypeRef.current = null;
		setIncomingCall(null);
	};

	// ----------- MUTE MIC -----------
	const toggleMute = () => {
		setIsMicMuted((prev) => {
			localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = prev));
			return !prev;
		});
	};

	// ----------- FLIP CAMERA -----------
	const flipCamera = async () => {
		if (!localStreamRef.current || callTypeRef.current !== 'video') return;

		const newMode = facingMode === 'user' ? 'environment' : 'user';
		setFacingMode(newMode);

		const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS(newMode));

		const newTrack = stream.getVideoTracks()[0];

		const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === 'video');

		if (sender) {
			await sender.replaceTrack(newTrack);
		}

		localStreamRef.current.getTracks().forEach((t) => t.stop());

		localStreamRef.current = stream;

		if (localVideoRef.current) localVideoRef.current.srcObject = stream;
	};

	// ----------- SOCKET SIGNALING LISTENERS -----------
	useEffect(() => {
		if (!socket) return;

		// INCOMING CALL POPUP
		const onIncomingCall = (data: IncomingCallData) => {
			setIncomingCall(data);
			startRingtone();
		};

		// OFFER
		const onOffer = async (data: WebRTCOfferPayload) => {
			console.log('📩 Offer received:', data);

			const type = data.type;
			callTypeRef.current = type;
			setCallType(type);

			if (!pcRef.current) pcRef.current = createPeerConnection();

			if (!localStreamRef.current) {
				const constraints = type === 'audio' ? AUDIO_CONSTRAINTS : VIDEO_CONSTRAINTS(facingMode);

				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				localStreamRef.current = stream;

				if (type === 'video' && localVideoRef.current) localVideoRef.current.srcObject = stream;

				if (type === 'audio' && localAudioRef.current) localAudioRef.current.srcObject = stream;

				stream.getTracks().forEach((t) => pcRef.current!.addTrack(t, stream));
			}

			await pcRef.current!.setRemoteDescription(new RTCSessionDescription(data.sdp));

			const answer = await pcRef.current!.createAnswer();
			await pcRef.current!.setLocalDescription(answer);

			socket.emit('webrtc_answer', {
				roomId,
				sdp: answer,
				type,
			});
		};

		// ANSWER
		const onAnswer = async (data: WebRTCAnswerPayload) => {
			console.log('📩 Answer received:', data);

			if (!pcRef.current) return;

			await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
			stopRingtone();
		};

		// ICE CANDIDATES
		const onIce = async (data: IceCandidatePayload) => {
			if (pcRef.current && data.candidate) {
				try {
					await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
				} catch (err) {
					console.error('ICE error', err);
				}
			}
		};

		// CALL ACCEPTED
		const onCallAccepted = () => {
			console.log('📞 Call accepted');
			stopRingtone();
		};

		const onVideoCallAccepted = () => {
			console.log('🎥 Video call accepted');
			stopRingtone();
		};

		// REJECT + END
		const onReject = () => endCall(false);
		const onVideoReject = () => endCall(false);
		const onCallEnded = () => endCall(false);
		const onVideoCallEnded = () => endCall(false);

		// REGISTER EVENTS
		socket.on('incoming_call', onIncomingCall);
		socket.on('incoming_video_call', onIncomingCall);

		socket.on('webrtc_offer', onOffer);
		socket.on('webrtc_answer', onAnswer);
		socket.on('webrtc_ice_candidate', onIce);

		socket.on('call_accepted', onCallAccepted);
		socket.on('video_call_accepted', onVideoCallAccepted);

		socket.on('call_rejected', onReject);
		socket.on('video_call_rejected', onVideoReject);

		socket.on('call_ended', onCallEnded);
		socket.on('video_call_ended', onVideoCallEnded);

		return () => {
			socket.off('incoming_call', onIncomingCall);
			socket.off('incoming_video_call', onIncomingCall);

			socket.off('webrtc_offer', onOffer);
			socket.off('webrtc_answer', onAnswer);
			socket.off('webrtc_ice_candidate', onIce);

			socket.off('call_accepted', onCallAccepted);
			socket.off('video_call_accepted', onVideoCallAccepted);

			socket.off('call_rejected', onReject);
			socket.off('video_call_rejected', onVideoReject);

			socket.off('call_ended', onCallEnded);
			socket.off('video_call_ended', onVideoCallEnded);
		};
	}, [socket, roomId, facingMode]);

	return {
		callType,
		isCaller,
		inCall,
		incomingCall,
		isMicMuted,

		localVideoRef,
		remoteVideoRef,
		localAudioRef,
		remoteAudioRef,

		startCall,
		acceptCall,
		rejectCall,
		endCall,
		toggleMute,
		flipCamera,
	};
};
