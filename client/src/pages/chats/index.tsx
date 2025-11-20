import {
	IonAvatar,
	IonButton,
	IonButtons,
	IonCard,
	IonCardHeader,
	IonContent,
	IonFab,
	IonFabButton,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonMenuToggle,
	IonPage,
	IonProgressBar,
	IonText,
	IonToolbar,
} from '@ionic/react';
import { authStore } from '../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { chatbubbleEllipsesOutline, sync } from 'ionicons/icons';
import { getChats } from '../../services/chat';
import React from 'react';
import CreateChat from './CreateChat';
import Modal from '../../components/ui/Modal';
import { useSocket } from '../../hooks/sockets';
import { RiGroup2Fill } from 'react-icons/ri';
import Title from '../../components/ui/Title';
import Menu from '../../components/Menu';
import userDefaulfAvatar from '../../assets/user.png';
import groupDefaulfAvatar from '../../assets/group.png';

import { useNotifications } from '../../hooks/notifications';
import './style.css';
import { moon, sunny } from 'ionicons/icons';

const Chats: React.FC = () => {
	useNotifications();

	const { socket } = useSocket();
	const { avatar, userId, username } = authStore((store: any) => store);

	const [openCreateChat, setOpenCreateChat] = useState<boolean>(false);

	const getInitialTheme = () => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			return savedTheme;
		}
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		return prefersDark ? 'dark' : 'light';
	};
	const [theme, setTheme] = useState<string>(getInitialTheme);

	useEffect(() => {
		if (theme === 'dark') {
			document.body.classList.add('dark');
		} else {
			document.body.classList.remove('dark');
		}
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
	};

	const { data, isLoading, refetch } = useQuery<any>({
		queryKey: ['chats'],
		queryFn: getChats,
		refetchOnMount: 'always',
		refetchIntervalInBackground: true,
		// refetchInterval: openCreateChat ? 0 : 1000,
	});

	// const joinRoom = (chatId: string) => {
	// 	socket.emit('join_room', chatId);
	// };

	useEffect(() => {
		socket?.on('new_message', (data: any) => {
			// console.log('new message', data);
		});
	}, [socket]);

	const handleLastMessage = (chat: any) => {
		const lastMessage = chat?.messages[chat.messages.length - 1];

		if (!lastMessage) {
			return 'No messages yet';
		}
		if (lastMessage.senderId._id === userId) {
			return 'You: ' + lastMessage.message;
		} else {
			if (chat.type === 'private') {
				return lastMessage.message;
			} else {
				return lastMessage.senderId.username + ': ' + lastMessage.message;
			}
		}
	};

	const handleUnreadChats = () => {
		let unreadChats = 0;

		data?.forEach((chat: any) => {
			if (
				chat.messages[chat.messages.length - 1]?.read === false &&
				userId !== chat.messages[chat.messages.length - 1]?.senderId?._id
			) {
				unreadChats++;
			}
		});
		return unreadChats;
	};

	const getRefresh = () => {
		window.location.reload();
	};

	const getName = (chat: any) => {
		const member = chat.members.find((member: any) => member._id !== userId);
		return member.username;
	};

	const getAvatar = (chat: any) => {
		const member = chat.members.find((member: any) => member._id !== userId);
		if (!member.avatar) {
			return (
				<IonAvatar class="default-img">
					<img src={userDefaulfAvatar}></img>
				</IonAvatar>
			);
		} else {
			return (
				<IonAvatar>
					<img src={member.avatar}></img>
				</IonAvatar>
			);
		}
	};

	const getGroupAvatar = (chat: any) => {
		if (!chat.avatar) {
			return (
				<IonAvatar class="default-img">
					<img src={groupDefaulfAvatar}></img>
				</IonAvatar>
			);
		} else {
			return (
				<IonAvatar>
					<img src={chat.avatar} alt="group image"></img>
				</IonAvatar>
			);
		}
	};

	return (
		<>
			<Menu />
			<IonPage id="main-content">
				<IonHeader className="chats-header">
					<IonToolbar>
						<div
							style={{
								display: 'flex',
							}}
						>
							<IonMenuToggle
								style={{
									zIndex: 10000,
									cursor: 'pointer',
								}}
							>
								<img
									src={avatar ? avatar : userDefaulfAvatar}
									alt=""
									style={{
										width: '40px',
										height: '40px',
										borderRadius: '50%',
										marginLeft: '10px',
										boxShadow: '0px 0px 8px 0px #000000',
										zIndex: 10000,
										objectFit: 'cover',
										backgroundColor: 'white',
									}}
								></img>
							</IonMenuToggle>
							<Title title={`${username}'s inbox`} />
						</div>
						<IonButtons slot="end">
							<IonButton onClick={toggleTheme}>
								<IonIcon icon={theme === 'light' ? moon : sunny} style={{ color: 'white' }} />
							</IonButton>
							<IonButton
								slot="end"
								onClick={() => {
									getRefresh();
								}}
							>
								<IonIcon
									icon={sync}
									style={{
										color: 'white',
									}}
								></IonIcon>
							</IonButton>
						</IonButtons>
					</IonToolbar>
				</IonHeader>
				{isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}

				<IonContent>
					{data?.length === 0 ? (
						<IonCard style={{ margin: '20px' }}>
							<IonCardHeader
								style={{
									letterSpacing: '3px',
									fontSize: '14px',
									color: 'var(--ion-color-primary)',
									textAlign: 'center',
								}}
							>
								Click the button below to find a contact.
							</IonCardHeader>
						</IonCard>
					) : (
						<div style={{ padding: '5px' }}>
							<p
								style={
									handleUnreadChats() > 0
										? {
												fontWeight: 'bold',
												fontSize: '14px',
												paddingLeft: '4px',
												color: 'var(--ion-color-light-contrast)',
										  }
										: {
												fontSize: '14px',
												paddingLeft: '4px',
												color: 'var(--ion-color-light-contrast)',
										  }
								}
							>
								Unread Chats({handleUnreadChats()})
							</p>
							{data?.map((chat: any, index: any) => {
								return (
									<div key={index}>
										<IonItem className="ion-no-padding" routerLink={`/chat/${chat._id}`} onClick={() => {}}>
											<div className="chats-item">
												{chat.type === 'private' && getAvatar(chat)}

												{chat.type === 'group' && getGroupAvatar(chat)}

												<div
													style={
														chat.messages[chat.messages.length - 1]?.read === false &&
														userId !== chat.messages[chat.messages.length - 1]?.senderId._id
															? {
																	fontWeight: 'bold',
																	padding: '10px',
																	display: 'grid',
																	width: '100%',
																	gap: '5px',
															  }
															: {
																	fontWeight: 'normal',
																	padding: '10px',
																	display: 'grid',
																	width: '100%',
																	gap: '5px',
															  }
													}
												>
													<IonLabel
														style={{
															color: 'var(--ion-color-light-contrast)',
														}}
													>
														{chat.type === 'private' ? getName(chat) : chat.name}
													</IonLabel>
													<IonText
														style={{
															fontSize: '14px',
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															color: 'var(--ion-color-light-contrast)',
														}}
													>
														{handleLastMessage(chat)}
													</IonText>
												</div>
											</div>
										</IonItem>
									</div>
								);
							})}
						</div>
					)}

					<IonFab slot="fixed" vertical="bottom" horizontal="end">
						<IonFabButton
							className="ion-no-margin"
							color="primary"
							// size="small"
							onClick={() => {
								setOpenCreateChat(true);
							}}
						>
							<IonIcon
								size="large"
								icon={chatbubbleEllipsesOutline}
								// color="light"
								style={{
									color: 'white',
								}}
							/>
						</IonFabButton>
					</IonFab>
				</IonContent>

				<Modal
					isOpen={openCreateChat}
					onClose={setOpenCreateChat}
					title="New chat"
					closeModal={() => {
						setOpenCreateChat(false);
					}}
				>
					<CreateChat
						closeModal={() => {
							setOpenCreateChat(false);
						}}
						refetch={refetch}
					/>
				</Modal>

				{/* <IonTabBar slot="bottom"></IonTabBar> */}
			</IonPage>
		</>
	);
};

export default Chats;
