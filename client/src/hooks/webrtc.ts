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

	// extra refs για flow
	const hasAcceptedRef = useRef(false);
	const pendingOfferRef = useRef<WebRTCOfferPayload | null>(null);
	const localTracksAddedRef = useRef(false);

	// join room για WebRTC
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
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				// εδώ αν θες βάζεις TURN server
			],
		});

		pc.ontrack = (event: RTCTrackEvent) => {
			console.log('🎥 ontrack fired, streams:', event.streams);
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

		pc.onconnectionstatechange = () => {
			console.log('🔗 PC state:', pc.connectionState);
		};

		return pc;
	};

	// helper: βάζει local stream πάνω στο PC και στο UI (μία φορά)
	const ensureLocalStreamAndTracks = async (type: 'audio' | 'video') => {
		if (!localStreamRef.current) {
			const constraints: MediaStreamConstraints =
				type === 'audio'
					? {
							audio: {
								echoCancellation: true,
								noiseSuppression: true,
								autoGainControl: true,
								channelCount: 1,
							},
					  }
					: {
							audio: {
								echoCancellation: true,
								noiseSuppression: true,
								autoGainControl: true,
								channelCount: 1,
							},
							video: { facingMode },
					  };

			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;

			if (type === 'video' && localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}
			if (type === 'audio' && localAudioRef.current) {
				localAudioRef.current.srcObject = stream;
			}
		}

		if (pcRef.current && !localTracksAddedRef.current && localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => {
				pcRef.current!.addTrack(track, localStreamRef.current!);
			});
			localTracksAddedRef.current = true;
		}
	};

	// ---------- START CALL (caller) ----------
	const startCall = async (type: 'audio' | 'video') => {
		if (!socket || !roomId) return;

		setCallType(type);
		setIsCaller(true);
		setInCall(true);
		setIncomingCall(null);
		setIsMicMuted(false);
		hasAcceptedRef.current = false;
		pendingOfferRef.current = null;
		localTracksAddedRef.current = false;

		startRingtone(); // ο caller ακούει ringtone μέχρι να γίνει accept/reject

		pcRef.current = createPeerConnection();

		// local media & tracks
		await ensureLocalStreamAndTracks(type);

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
			fromUser: { _id: localUserId }, // στο backend μπορείς να βάλεις κι άλλα
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

		hasAcceptedRef.current = true;

		// ενημερώνουμε τον caller ότι δεχτήκαμε
		socket.emit(type === 'audio' ? 'accept_call' : 'video_call_accept', { roomId });

		setIncomingCall(null);

		// αν είχε έρθει ήδη offer, το χειριζόμαστε τώρα
		if (pendingOfferRef.current) {
			await handleIncomingOffer(pendingOfferRef.current);
			pendingOfferRef.current = null;
		}
	};

	// ---------- REJECT CALL ----------
	const rejectCall = () => {
		if (!incomingCall || !socket) return;

		stopRingtone();

		socket.emit(incomingCall.type === 'audio' ? 'reject_call' : 'video_call_reject', { roomId });

		setIncomingCall(null);
		setCallType(null);
		hasAcceptedRef.current = false;
		pendingOfferRef.current = null;
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
		hasAcceptedRef.current = false;
		pendingOfferRef.current = null;
		localTracksAddedRef.current = false;
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

	// ---------- HANDLE INCOMING OFFER (callee) ----------
	const handleIncomingOffer = async (data: WebRTCOfferPayload) => {
		console.log('📩 handling incoming offer:', data);

		// αν δεν έχει πατήσει Accept ακόμα, απλά το κρατάμε
		if (!hasAcceptedRef.current) {
			console.log('⏸ Offer received but call not accepted yet. Storing as pending.');
			pendingOfferRef.current = data;
			return;
		}

		if (!pcRef.current) {
			pcRef.current = createPeerConnection();
		}

		// local media & tracks (callee)
		await ensureLocalStreamAndTracks(data.type);

		// τώρα βάζουμε το remote SDP
		await pcRef.current!.setRemoteDescription(new RTCSessionDescription(data.sdp));

		const answer = await pcRef.current!.createAnswer();
		await pcRef.current!.setLocalDescription(answer);

		socket?.emit('webrtc_answer', {
			roomId,
			sdp: answer,
			type: data.type,
		});
	};

	// ---------- SOCKET EVENTS ----------
	useEffect(() => {
		if (!socket) return;

		const onIncomingCall = (data: IncomingCallData) => {
			console.log('📲 incoming_call', data);
			setIncomingCall(data);
			startRingtone(); // ο callee ακούει μέχρι accept/reject
		};

		const onOffer = async (data: WebRTCOfferPayload) => {
			console.log('📩 webrtc_offer', data);
			await handleIncomingOffer(data);
		};

		const onAnswer = async (data: WebRTCAnswerPayload) => {
			console.log('📩 webrtc_answer', data);
			if (!pcRef.current) return;

			await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
		};

		const onIceCandidate = async (data: IceCandidatePayload) => {
			console.log('📩 received ICE:', data.candidate);

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
