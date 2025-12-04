// /hooks/useWebRTC.ts
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

	// -- Ringtone -------------------------------------------------------
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

	// -- PeerConnection --------------------------------------------------
	const createPeerConnection = () => {
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		});

		pc.ontrack = (event: RTCTrackEvent) => {
			const remoteStream = event.streams[0];

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = remoteStream;
			}
			if (remoteAudioRef.current) {
				remoteAudioRef.current.srcObject = remoteStream;
			}
		};

		pc.onicecandidate = (e) => {
			if (e.candidate) {
				socket?.emit('webrtc_ice_candidate', {
					roomId,
					candidate: e.candidate.toJSON(),
				} as IceCandidatePayload);
			}
		};

		return pc;
	};

	// -- Start Call -----------------------------------------------------
	const startCall = async (type: 'audio' | 'video') => {
		if (!socket) return;

		setCallType(type);
		setIsCaller(true);
		setInCall(true);

		startRingtone();

		const constraints: MediaStreamConstraints =
			type === 'audio' ? { audio: true } : { audio: true, video: { facingMode } };

		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		// Show local media
		if (type === 'video' && localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
		if (type === 'audio' && localAudioRef.current) {
			localAudioRef.current.srcObject = stream;
		}

		pcRef.current = createPeerConnection();

		stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));

		const offer = await pcRef.current!.createOffer();
		await pcRef.current!.setLocalDescription(offer);

		socket.emit('webrtc_offer', {
			roomId,
			sdp: offer,
			type,
		} as WebRTCOfferPayload);

		socket.emit(type === 'audio' ? 'call_user' : 'video_call_user', {
			roomId,
			fromUser: remoteUserId,
		});
	};

	const acceptCall = async () => {
		if (!incomingCall || !socket) return;

		stopRingtone();

		const type = incomingCall.type;
		setCallType(type);
		setIsCaller(false);
		setInCall(true);

		if (!pcRef.current) {
			pcRef.current = createPeerConnection();
		}

		const constraints = type === 'audio' ? { audio: true } : { audio: true, video: { facingMode } };

		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		localStreamRef.current = stream;

		if (type === 'video' && localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
		if (type === 'audio' && localAudioRef.current) {
			localAudioRef.current.srcObject = stream;
		}

		stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));

		socket.emit(type === 'audio' ? 'accept_call' : 'video_call_accept', {
			roomId,
		});

		setIncomingCall(null);
	};

	// -- Reject Call ----------------------------------------------------
	const rejectCall = () => {
		if (!incomingCall) return;

		stopRingtone();

		socket?.emit(incomingCall.type === 'audio' ? 'reject_call' : 'video_call_reject', { roomId });

		setIncomingCall(null);
		setCallType(null);
	};

	// -- End Call -------------------------------------------------------
	const endCall = (notify = true) => {
		stopRingtone();

		localStreamRef.current?.getTracks().forEach((t) => t.stop());
		localStreamRef.current = null;

		if (pcRef.current) {
			pcRef.current.close();
			pcRef.current = null;
		}

		if (notify && callType) {
			socket?.emit(callType === 'audio' ? 'end_call' : 'video_call_end', { roomId });
		}

		setInCall(false);
		setCallType(null);
		setIncomingCall(null);
		setIsCaller(false);
	};

	// -- Mute / Unmute --------------------------------------------------
	const toggleMute = () => {
		setIsMicMuted((prev) => {
			localStreamRef.current?.getAudioTracks().forEach((t) => {
				t.enabled = prev; // reverse
			});
			return !prev;
		});
	};

	// -- Flip Camera ----------------------------------------------------
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

		if (sender) await sender.replaceTrack(newVideoTrack);

		localStreamRef.current.getTracks().forEach((t) => t.stop());

		localStreamRef.current = stream;

		if (localVideoRef.current) {
			localVideoRef.current.srcObject = stream;
		}
	};

	// -- Socket Events (Offer / Answer / ICE / incoming calls) ----------
	useEffect(() => {
		if (!socket) return;

		const onIncomingCall = (data: IncomingCallData) => {
			setIncomingCall(data);
			startRingtone();
		};

		const onOffer = async (data: WebRTCOfferPayload) => {
			if (!pcRef.current) pcRef.current = createPeerConnection();

			await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

			const answer = await pcRef.current.createAnswer();
			await pcRef.current.setLocalDescription(answer);

			socket.emit('webrtc_answer', {
				roomId,
				sdp: answer,
			} as WebRTCAnswerPayload);
		};

		const onAnswer = async (data: WebRTCAnswerPayload) => {
			await pcRef.current?.setRemoteDescription(new RTCSessionDescription(data.sdp));
		};

		const onIceCandidate = async (data: IceCandidatePayload) => {
			if (data.candidate) {
				await pcRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
			}
		};

		socket.on('incoming_call', onIncomingCall);
		socket.on('incoming_video_call', onIncomingCall);
		socket.on('webrtc_offer', onOffer);
		socket.on('webrtc_answer', onAnswer);
		socket.on('webrtc_ice_candidate', onIceCandidate);
		socket.on('call_ended', () => endCall(false));
		socket.on('video_call_ended', () => endCall(false));

		return () => {
			socket.off('incoming_call', onIncomingCall);
			socket.off('incoming_video_call', onIncomingCall);
			socket.off('webrtc_offer', onOffer);
			socket.off('webrtc_answer', onAnswer);
			socket.off('webrtc_ice_candidate', onIceCandidate);
			socket.off('call_ended');
			socket.off('video_call_ended');
		};
	}, [socket, roomId]);

	// -- Return API ------------------------------------------------------
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
