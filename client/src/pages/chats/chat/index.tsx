import {
	IonAvatar,
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonFab,
	IonFabButton,
	IonFabList,
	IonHeader,
	IonIcon,
	IonPage,
	IonProgressBar,
	IonToolbar,
	useIonRouter,
} from '@ionic/react';
// import EmojiPicker from 'emoji-picker-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
	arrowBack,
	send,
	peopleOutline,
	informationOutline,
	ellipsisHorizontalOutline,
	trashBinOutline,
	cameraOutline,
	imageOutline,
	call,
	videocam,
} from 'ionicons/icons';
import { RiRobot2Line } from 'react-icons/ri';
import { getChat, sendMessage, deleteChat, readMessage } from '../../../services/chat';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { authStore } from '../../../store/auth';
import { useSocket } from '../../../hooks/sockets';
import MessageBox from './MessageBox';
import ringtonePlayer from '/ringtone.mp3';
import userDefaulfAvatar from '../../../assets/user.png';
import { useWebRTC } from '../../../hooks/webrtc'; // βεβαιώσου ότι αυτό είναι το σωστό path/filename

import './style.css';
import Modal from '../../../components/ui/Modal';
import ChatOptions from '../../../components/ChatOptions';
import Title from '../../../components/ui/Title';

const Chat: React.FC = () => {
	const { chatId } = useParams<{ chatId: string }>();
	const { userId } = authStore((store: any) => store);
	const { socket } = useSocket();

	const [newMessage, setNewMessage] = useState<string>('');
	const [messages, setMessages] = useState<any[]>([]);
	const [openOptions, setOpenOptions] = useState<boolean>(false);
	const [chat, setChat] = useState<any>(null);
	const [isRunning, setIsRunning] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [openTakePicture, setOpenTakePicture] = useState(false);
	const [image, setImage] = useState<string>('');
	const [newImage, setNewImage] = useState<string>('');
	const [openEmoji, setOpenEmoji] = useState<boolean>(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingOlder, setIsLoadingOlder] = useState(false);

	const router = useIonRouter();
	const contentRef = useRef<HTMLIonContentElement>(null);

	// ----------------- WebRTC hook -----------------
	// remoteUserId μπορεί να είναι undefined στην αρχή, οπότε βάζουμε fallback σε '' (το hook απλώς θα μην καλέσει call_user αν δεν το χρειαστείς).
	const remoteUserId = chat?.members?.find((member: any) => member._id !== userId)?._id ?? '';

	const {
		callType,
		inCall,
		incomingCall,
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
	} = useWebRTC({
		socket,
		roomId: chatId!,
		localUserId: userId,
		remoteUserId,
		ringtoneSrc: ringtonePlayer,
	});

	// helpers για FABs
	const startAudioCall = () => startCall('audio');
	const startVideoCall = () => startCall('video');

	// ----------------- React Query mutations -----------------
	const { mutate: readMessageMutate } = useMutation({
		mutationFn: ({ chatId, messageId }: any) => readMessage(chatId, messageId),
	});

	const { mutate: mutateChat } = useMutation({
		mutationFn: ({ chatId, page = 1 }: any) => getChat(chatId, page),
		onSuccess: async (res: any, variables: any) => {
			const requestedPage = variables?.page ?? 1;

			setChat(res?.chat);
			if (requestedPage === 1) {
				setMessages(res?.chat?.messages || []);
				setTimeout(() => {
					contentRef.current?.scrollToBottom(300);
				}, 50);
			} else {
				setMessages((prev) => [...(res?.chat?.messages || []), ...prev]);
			}

			setHasMore(Boolean(res.hasMore));

			if (res?.chat?.messages?.length > 0) {
				const lastMsg = res.chat.messages[res.chat.messages.length - 1];
				if (lastMsg && lastMsg.senderId?._id !== userId && !lastMsg.read) {
					readMessageMutate({ chatId, messageId: lastMsg._id });
				}
			}

			setIsLoading(false);
		},
		onError: () => {
			setIsLoading(false);
			setIsLoadingOlder(false);
		},
	});

	const { mutate, isLoading: messageIsLoading } = useMutation({
		mutationFn: ({ chatId, newMessage, image }: any) => sendMessage({ chatId, newMessage, image }),
	});

	const { mutate: mutateDeleteChat } = useMutation({
		mutationFn: ({ chatId }: any) => deleteChat(chatId),
	});

	const deletedChat = () => {
		mutateDeleteChat(
			{ chatId },
			{
				onSuccess: () => {
					router.push('/inbox', 'forward', 'replace');
				},
				onError: (error: any) => {
					console.log('error', error);
				},
			}
		);
	};

	const handleNewMessage = () => {
		if (newMessage === '' && !image) return;
		mutate(
			{ chatId, newMessage, image },
			{
				onSuccess: (res: any) => {
					const messageData = {
						...res.chat.messages[res.chat.messages.length - 1],
						room: chatId,
					};
					socket?.emit('send_message', messageData);
					setMessages((prevMessages) => [...prevMessages, messageData]);
					contentRef?.current?.scrollToBottom();
					setNewMessage('');
					setImage('');
				},
				onError: (error: any) => {
					console.log('error', error);
				},
			}
		);
	};

	const handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			handleNewMessage();
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { value } = event.target;
		setIsRunning(value.length > 0);
		setNewMessage(value);
	};

	const getAvatar = () => {
		const member = chat?.members?.find((member: any) => member._id !== userId);
		if (!member?.avatar) {
			return userDefaulfAvatar;
		}
		return member.avatar;
	};

	const getName = (chat: any) => {
		if (chat.type === 'private') {
			const member = chat?.members?.find((member: any) => member._id !== userId);
			return member?.username ?? '';
		} else {
			return chat.name;
		}
	};

	const handleGallery = async () => {
		const image = await Camera.getPhoto({
			quality: 90,
			allowEditing: false,
			resultType: CameraResultType.DataUrl,
			source: CameraSource.Photos,
		});

		const imageUrl = image.dataUrl || '';
		setImage(imageUrl);
		return imageUrl;
	};

	const handleCamera = async () => {
		const image = await Camera.getPhoto({
			quality: 90,
			allowEditing: false,
			resultType: CameraResultType.DataUrl,
			source: CameraSource.Camera,
		});

		const imageUrl = image.dataUrl || '';
		setImage(imageUrl);
		return imageUrl;
	};

	const handleScroll = async (e: CustomEvent) => {
		const scrollTop = e.detail.scrollTop;
		if (scrollTop < 100 && hasMore && !isLoadingOlder) {
			setIsLoadingOlder(true);
			const nextPage = page + 1;

			const scrollEl = await contentRef.current?.getScrollElement();
			const prevHeight = scrollEl?.scrollHeight ?? 0;

			mutateChat(
				{ chatId, page: nextPage },
				{
					onSuccess: async () => {
						setPage(nextPage);
						setIsLoadingOlder(false);

						requestAnimationFrame(async () => {
							const newHeight = scrollEl?.scrollHeight ?? 0;
							const delta = newHeight - prevHeight;
							if (delta > 0) {
								await contentRef.current?.scrollToPoint(0, delta, 0);
							}
						});
					},
					onError: () => {
						setIsLoadingOlder(false);
					},
				}
			);
		}
	};

	// ----------------- useEffects -----------------
	useEffect(() => {
		if (!socket || !chatId) return;
		socket.emit('join_room', chatId);
	}, [socket, chatId]);

	useEffect(() => {
		if (!socket) return;

		const handleReceive = (message: any) => {
			setMessages((prevMessages) => [...prevMessages, message]);
		};

		socket.on('receive_message', handleReceive);

		return () => {
			socket.off('receive_message', handleReceive);
		};
	}, [socket]);

	useEffect(() => {
		setIsLoading(true);
		setPage(1);
		mutateChat({ chatId, page: 1 });
	}, [chatId]);

	useEffect(() => {
		if (messages.length === 0) return;
		setTimeout(() => {
			contentRef.current?.scrollToBottom(300);
		}, 100);
	}, [messages.length]);

	// ----------------- JSX -----------------
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton
							defaultHref="/inbox"
							style={{
								color: 'white',
							}}
						>
							<IonIcon icon={arrowBack} size="medium"></IonIcon>
						</IonBackButton>
					</IonButtons>

					{chat && (
						<div
							className="chat-bar"
							color="secondary"
							style={{
								display: 'flex',
								marginLeft: '.5rem',
							}}
						>
							<IonAvatar class="chat-user-avatar">
								{chat.type === 'private' && <img src={getAvatar()} alt="user image" />}
								{chat.avatar && chat.type === 'group' && <img src={chat.avatar} alt="group image" />}
							</IonAvatar>

							<Title title={getName(chat)} className="ion-padding" />
						</div>
					)}
				</IonToolbar>
			</IonHeader>

			{isLoading && <IonProgressBar type="indeterminate" />}
			<IonContent ref={contentRef} className="ion-padding-top" scrollEvents={true} onIonScroll={handleScroll}>
				{isLoadingOlder && <div style={{ textAlign: 'center', padding: '8px 0' }}>Loading older messages...</div>}
				{messages &&
					messages.map((message: any, index: number) => {
						const isMine = userId === message.senderId._id;
						return (
							<div
								key={index}
								style={{
									display: 'flex',
									flexDirection: isMine ? 'row-reverse' : 'row',
									alignSelf: isMine ? 'flex-end' : 'flex-start',
								}}
							>
								<img
									src={message.senderId.avatar ? message.senderId.avatar : userDefaulfAvatar}
									style={{
										borderRadius: '100%',
										height: '20px',
										width: '20px',
										margin: '10px',
										marginTop: '15px',
										backgroundColor: 'white',
										objectFit: 'cover',
									}}
									alt="user"
								/>

								<MessageBox message={message} image={image} chatId={chatId} />
							</div>
						);
					})}
			</IonContent>

			{/* Input / send area */}
			<div
				style={{
					justifyItems: 'flex-end',
					boxShadow: '0px 0px 0px 0px var(--ion-color-primary)',
					display: 'flex',
					backgroundColor: 'var(--ion-color-secondary)',
					paddingRight: '.2rem',
				}}
			>
				<input
					type="text"
					value={newMessage}
					placeholder="Aa..."
					onKeyUp={handleEnterPress}
					onChange={handleInputChange}
					className="new-message-input"
				/>
				<IonButton
					onClick={handleNewMessage}
					expand="block"
					color="primary"
					style={{
						margin: '.5rem',
					}}
				>
					<IonIcon
						icon={messageIsLoading ? ellipsisHorizontalOutline : send}
						style={{
							margin: '0 auto',
							color: 'white',
						}}
					/>
				</IonButton>
				<IonButton onClick={handleGallery} className="ion-no-margin new-message-snd-btns" size="small">
					<IonIcon icon={imageOutline} color="white" size="small" />
				</IonButton>
				<IonButton onClick={handleCamera} className="ion-no-margin new-message-snd-btns" size="small">
					<IonIcon icon={cameraOutline} size="small" color="white" />
				</IonButton>
				<IonButton className="ion-no-margin new-message-snd-btns" size="small">
					<RiRobot2Line size={18} />
				</IonButton>
			</div>

			{/* Modal με options */}
			<Modal
				isOpen={openOptions}
				onClose={setOpenOptions}
				title="Members"
				closeModal={() => {
					setOpenOptions(false);
				}}
			>
				<ChatOptions
					closeModal={() => {
						setOpenOptions(false);
					}}
					chat={chat}
					isLoading={isLoading}
				/>
			</Modal>

			{/* FAB για κλήσεις */}
			<IonFab
				slot="fixed"
				horizontal="end"
				style={{
					marginRight: '3rem',
				}}
			>
				<IonFabButton size="small" color="secondary">
					<IonIcon
						icon={call}
						style={{
							color: 'white',
						}}
					/>
				</IonFabButton>
				<IonFabList side="bottom">
					<IonFabButton onClick={startAudioCall}>
						<IonIcon icon={call} color="primary" />
					</IonFabButton>
					<IonFabButton onClick={startVideoCall} style={{ transition: 'all 0.3s ease-in-out' }}>
						<IonIcon icon={videocam} color="primary" />
					</IonFabButton>
				</IonFabList>
			</IonFab>

			{/* FAB για πληροφορίες / delete / μέλη */}
			<IonFab slot="fixed" horizontal="end">
				<IonFabButton size="small" color="secondary">
					<IonIcon
						icon={informationOutline}
						style={{
							color: 'white',
						}}
					/>
				</IonFabButton>
				<IonFabList side="bottom">
					<IonFabButton
						onClick={deletedChat}
						style={{
							transition: 'all 0.3s ease-in-out',
						}}
						routerLink="/inbox"
					>
						<IonIcon icon={trashBinOutline} color="primary" />
					</IonFabButton>
					{chat?.type === 'group' && (
						<IonFabButton
							onClick={() => {
								setOpenOptions(!openOptions);
							}}
						>
							<IonIcon icon={peopleOutline} color="primary" />
						</IonFabButton>
					)}
				</IonFabList>
			</IonFab>

			{/* Incoming call popup */}
			{incomingCall && (
				<div className="incoming-call-container">
					<div className="popup">
						{chat?.type === 'private' && incomingCall.fromUser.avatar ? (
							<img src={incomingCall.fromUser.avatar} className="incoming-call-avatar" />
						) : (
							<img src={userDefaulfAvatar} className="incoming-call-avatar" />
						)}

						<h2>{incomingCall.fromUser.username} is calling...</h2>

						<IonButton onClick={acceptCall} color="success">
							Accept
						</IonButton>
						<IonButton onClick={rejectCall} color="danger">
							Reject
						</IonButton>
					</div>
				</div>
			)}

			{/* Video call UI */}
			{inCall && callType === 'video' && (
				<div className="video-call-ui">
					<video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
					<video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />

					<div className="call-controls">
						{/* Αν θες mute, ξε-κάνε comment αυτό */}
						{/* <IonButton onClick={toggleMute} color="secondary">
							{isMicMuted ? 'Unmute' : 'Mute'}
						</IonButton> */}

						<IonButton onClick={flipCamera} color="secondary">
							Flip
						</IonButton>

						<IonButton onClick={() => endCall(true)} color="danger">
							End
						</IonButton>
					</div>
				</div>
			)}

			{/* Audio call UI */}
			{inCall && callType === 'audio' && (
				<div className="audio-call-ui">
					{chat?.type === 'private' && chat?.members?.find((member: any) => member._id === userId)?.avatar ? (
						<img
							src={chat?.members?.find((member: any) => member._id === userId)?.avatar}
							className="audio-call-avatar"
						/>
					) : (
						<img src={userDefaulfAvatar} className="audio-call-avatar" />
					)}

					<audio ref={localAudioRef} autoPlay muted />
					<audio ref={remoteAudioRef} autoPlay />

					<div className="call-controls">
						{/* <IonButton onClick={toggleMute} color="secondary">
							{isMicMuted ? 'Unmute' : 'Mute'}
						</IonButton> */}
						<IonButton onClick={() => endCall(true)} color="danger">
							End
						</IonButton>
					</div>
				</div>
			)}
		</IonPage>
	);
};

export default Chat;
