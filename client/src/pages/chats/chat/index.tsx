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
} from 'ionicons/icons';
import { getChat, sendMessage, deleteChat, readMessage } from '../../../services/chat';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { authStore } from '../../../store/auth';
// import { useSocket } from "../../../hooks/sockets";
import MessageBox from './MessageBox';
import userDefaulfAvatar from '../../../assets/user.png';
import groupDefaulfAvatar from '../../../assets/group.png';

import './style.css';
import Modal from '../../../components/ui/Modal';

import ChatOptions from '../../../components/ChatOptions';
import { RiGroup2Fill } from 'react-icons/ri';
import Title from '../../../components/ui/Title';

const Chat: React.FC = () => {
	const { chatId } = useParams<{ chatId: string }>();
	const { userId } = authStore((store: any) => store);
	// const { socket } = useSocket();
	const [newMessage, setNewMessage] = useState<string>('');
	const [messages, setMessages] = useState<any[]>([]);
	const [openOptions, setOpenOptions] = useState<boolean>(false);
	const [chat, setChat] = useState<any>(null);
	const [delay, setDelay] = useState(1000);
	const [isRunning, setIsRunning] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [openTakePicture, setOpenTakePicture] = useState(false);
	const [image, setImage] = useState<string>('');
	const [newImage, setNewImage] = useState<string>('');
	const [openEmoji, setOpenEmoji] = useState<boolean>(false);

	const router = useIonRouter();
	const contentRef = useRef<HTMLIonContentElement>(null);
	const isEntered = useRef(false);

	const { mutate: readMessageMutate } = useMutation({
		mutationFn: ({ chatId, messageId }: any) => readMessage(chatId, messageId),
	});

	const { mutate: mutateChat } = useMutation({
		mutationFn: () => getChat(chatId),
		onSuccess: (res: any) => {
			setIsLoading(true);
			setMessages(res?.chat.messages);
			setChat(res?.chat);
			// console.log("isEntered.current", isEntered.current);
			// if (!isEntered.current) {
			//   contentRef?.current?.scrollToBottom();
			//   isEntered.current = true;
			// }

			if (res?.chat.messages.length > 0) {
				if (
					res?.chat.messages[res?.chat.messages.length - 1].senderId._id !== userId &&
					!res?.chat.messages[res?.chat.messages.length - 1].read
				) {
					readMessageMutate({
						chatId,
						messageId: res?.chat.messages[res?.chat.messages.length - 1]._id,
					});
				}
			}
		},
	});

	const { mutate, isLoading: messageIsLoading } = useMutation({
		mutationFn: ({ chatId, newMessage, image }: any) => sendMessage({ chatId, newMessage, image }),
	});

	const { mutate: mutateDeleteChat } = useMutation({
		mutationFn: ({ chatId }: any) => deleteChat(chatId),
	});

	// useInterval(
	//   () => {
	//     if (isRunning && !openOptions) {
	//       mutateChat();
	//     }
	//   },
	//   isRunning ? 5000 : null
	// );

	useEffect(() => {
		console.log('1111');
		if (isEntered.current) return;
		// console.log("222");
		mutateChat();
	}, []);

	useEffect(() => {
		console.log('isEntered', isEntered.current);
		if (!isEntered.current) {
			isEntered.current = true;
			contentRef?.current?.scrollToBottom();
			console.log('scrollToBottom');
		}
	}, [messages, contentRef.current]);

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
						// room: chatId,
					};
					// socket?.emit("send_message", messageData);
					setMessages((prevMessages) => [...prevMessages, messageData]);
					contentRef?.current?.scrollToBottom();
					setNewMessage('');
				},
				onError: (error: any) => {
					console.log('error', error);
				},
			}
		);
	};

	const handleEnterPress = (event: any) => {
		if (event.key === 'Enter') {
			handleNewMessage();
		}
	};

	const handleInputChange = (event: any) => {
		const { value } = event.target;
		setIsRunning(event.target.value.length > 0);
		setNewMessage(value);
	};

	const getAvatar = () => {
		const member = chat?.members.find((member: any) => member._id !== userId);
		if (!member.avatar) {
			return userDefaulfAvatar;
		}
		return member.avatar;
	};

	const getName = (chat: any) => {
		if (chat.type === 'private') {
			const member = chat?.members.find((member: any) => member._id !== userId);
			return member.username;
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

		let imageUrl = image.dataUrl;

		setImage(imageUrl || '');

		return imageUrl;
	};

	const handleCamera = async () => {
		const image = await Camera.getPhoto({
			quality: 90,
			allowEditing: false,
			resultType: CameraResultType.DataUrl,
			source: CameraSource.Camera,
		});

		let imageUrl = image.dataUrl;

		setImage(imageUrl || '');

		return imageUrl;
	};

	// sockets
	// useEffect(() => {
	//   socket?.emit("join_room", chatId);
	// }, [socket]);
	// useEffect(() => {
	//   socket?.on("receive_message", (message: any) => {
	//     console.log("receive_message", message);
	//     setMessages((prevMessages) => [...prevMessages, message]);
	//   });
	// }, [socket]);

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/inbox" color={'warning'}>
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

								{/* {chat.type === 'group' && chat.avatar ? (
									<img src={chat.avatar} alt="group image" />
								) : (
									<img src={groupDefaulfAvatar} alt="group image" />
								)} */}
								{chat.avatar && chat.type === 'group' && <img src={chat.avatar}></img>}
							</IonAvatar>

							<Title title={getName(chat)} className="ion-padding"></Title>
						</div>
					)}
				</IonToolbar>
			</IonHeader>

			{!isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
			<IonContent ref={contentRef} className="ion-padding-top">
				{messages &&
					messages.map((message: any, index: any) => {
						return (
							<div
								key={index}
								style={{
									display: 'flex',
									flexDirection: userId === message.senderId._id ? 'row-reverse' : 'row',
									alignSelf: userId === message.senderId._id ? 'flex-end' : 'flex-start',
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
									}}
									alt=""
								/>

								<MessageBox
									message={message}
									image={image}
									chatId={chatId}
									// refetch={refetch}
								></MessageBox>
							</div>
						);
					})}
			</IonContent>

			<div
				style={{
					justifyItems: 'flex-end',
					boxShadow: '0px 0px 0px 0px var(--ion-color-primary)',
					// border: "1px solid var(--ion-color-primary)",
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
					// onIonChange={handleInputChange}
					onChange={handleInputChange}
					className="new-message-input"
					// checked={isRunning}
				/>
				<IonButton
					onClick={handleNewMessage}
					expand="block"
					color="primary"
					// fill="outline"
					// shape="round"
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
					></IonIcon>
				</IonButton>
				<IonButton onClick={handleGallery} className="ion-no-margin new-message-snd-btns" size="small">
					<IonIcon icon={imageOutline} color="white" size="small"></IonIcon>
				</IonButton>
				<IonButton onClick={handleCamera} className="ion-no-margin new-message-snd-btns" size="small">
					<IonIcon icon={cameraOutline} size="small" color="white"></IonIcon>
				</IonButton>
			</div>

			{/* <div>
        {openEmoji && (
          <EmojiPicker
            width={"100%"}
            onEmojiClick={(event, emojiObject) => {
              console.log("emojiObject", emojiObject);
            }}
          />
        )}
      </div> */}
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
				></ChatOptions>
			</Modal>
			<IonFab slot="fixed" horizontal="end">
				<IonFabButton size="small" color="secondary">
					<IonIcon icon={informationOutline} color="dark"></IonIcon>
				</IonFabButton>
				<IonFabList side="bottom">
					{/* <IonFabButton>
            <IonIcon icon={imagesOutline} color="warning"></IonIcon>
            </IonFabButton> */}
					<IonFabButton
						onClick={() => {
							deletedChat();
						}}
						routerLink="/inbox"
					>
						<IonIcon icon={trashBinOutline} color="warning"></IonIcon>
					</IonFabButton>
					{chat?.type === 'group' && (
						<IonFabButton
							onClick={() => {
								setOpenOptions(!openOptions);
							}}
						>
							<IonIcon icon={peopleOutline} color="warning"></IonIcon>
						</IonFabButton>
					)}
				</IonFabList>
			</IonFab>
		</IonPage>
	);
};

export default Chat;
