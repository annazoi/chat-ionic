import { IonAvatar, IonButton, IonIcon, IonInput, IonItem, IonProgressBar, IonAlert } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import ImagePicker from '../ImagePicker';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { updatedChat, addMembers, removeMember } from '../../services/chat';
import { chatSchema } from '../../validations-schemas/chat';
import { ChatConfig } from '../../validations-schemas/interfaces/chat';
import SearchUsers from '../SearchUsers';
import userDefaultAvatar from '../../assets/user.png';
import { closeOutline, colorFill } from 'ionicons/icons';
import Title from '../ui/Title';
import './style.css';

interface ChatOptionsProps {
	closeModal: () => void;
	chat?: any;
	isLoading?: boolean;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({ closeModal, chat, isLoading }) => {
	const { chatId } = useParams<{ chatId: string }>();
	const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
	const [openAlert, setOpenAlert] = useState<boolean>(false);
	const [members, setMembers] = useState<any[]>([]);

	const { register, handleSubmit, setValue, getValues, reset } = useForm<ChatConfig>({
		resolver: yupResolver(chatSchema),
	});

	const { mutate: updatedMutate, isLoading: updatedIsLoading } = useMutation({
		mutationFn: (newData: any) => updatedChat(chatId, newData),
	});

	const { mutate: addMembersMutate } = useMutation({
		mutationFn: (members: string[]) => addMembers(chatId, members),
	});

	const { mutate: removeMemberMutate } = useMutation({
		mutationFn: (memberId: string) => removeMember(chatId, memberId),
	});

	// useEffect(() => {
	//   try {
	//     chat(chatId, {
	//       onSuccess: (data: any) => {
	//         setAvatar(data?.chat.avatar);
	//         setMembers(data?.chat.members);
	//         reset({
	//           avatar: avatar ? data?.chat.avatar : "",
	//           name: data?.chat.name,
	//         });
	//       },
	//     });
	//   } catch (error) {
	//     console.log("error", error);
	//   }
	// }, []);

	useEffect(() => {
		setMembers(chat?.members);
		reset({
			avatar: chat?.avatar ? chat?.avatar : '',
			name: chat?.name,
		});
	}, [chat]);

	const handleImage = (avatar: string) => {
		setValue('avatar', avatar);
	};

	const handleSelectUser = (e: any, userId: string) => {
		if (e.detail.checked) {
			setSelectedUsers([...selectedUsers, userId]);
		} else {
			setSelectedUsers(selectedUsers.filter((user) => user !== userId));
		}
	};

	const handleAddMembers = () => {
		if (selectedUsers.length === 0) return;
		try {
			addMembersMutate(selectedUsers, {
				onSuccess: (res: any) => {
					closeModal();
				},
			});
		} catch (error) {
			console.log('error', error);
		}
	};

	const handleRemoveMember = (chatId: string, memberId: string) => {
		try {
			removeMemberMutate(memberId, {
				onSuccess: (res: any) => {
					// closeModal();
				},
			});
		} catch (error) {
			console.log('error', error);
		}
	};

	const onSubmit = (data: any) => {
		try {
			updatedMutate(data, {
				onSuccess: (res: any) => {
					handleAddMembers();
					closeModal();
				},

				onError: (error: any) => {
					console.log('error', error);
				},
			});
		} catch (error) {
			console.log('error', error);
		}
	};

	return (
		<div
			style={{
				textAlign: 'center',
				margin: '0 auto',
				padding: '20px',
				background: 'var(--ion-color-modal)',
				height: '100%',
			}}
		>
			{!isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
			<form onSubmit={handleSubmit(onSubmit)}>
				<ImagePicker onChange={handleImage} register={register} value={getValues('avatar')}></ImagePicker>
				<IonInput
					labelPlacement="floating"
					label="Change name"
					className="ion-margin-top input-container"
					color="secondary"
					{...register('name', { required: true })}
					// style={{ backgroundColor: 'white' }}
				/>
				<IonButton type="submit" expand="block" className="ion-margin-top" style={{ color: 'white' }}>
					{updatedIsLoading ? 'Updating...' : 'Update'}
				</IonButton>
				{chat?.members.map((member: any, index: any) => {
					return (
						<div key={index} id={index} className="chat-members-content">
							<IonItem>
								<IonAvatar>
									<img src={member.avatar ? member.avatar : userDefaultAvatar} alt="" />
								</IonAvatar>
								<Title
									title={member.username}
									className=""
									style={{
										position: 'absolute',
										top: ' 50%',
										left: '50%',
										transform: 'translate(-50%, -50%)',
									}}
								></Title>
								<IonIcon
									icon={closeOutline}
									onClick={() => {
										setOpenAlert(true);
									}}
									slot="end"
									style={{
										color: 'var(--ion-color-placeholder',
									}}
								></IonIcon>
							</IonItem>
							<IonAlert
								isOpen={openAlert}
								message="Are you sure you want to remove this member?"
								buttons={[
									'cancel',
									{
										text: 'Delete',
										handler: () => {
											handleRemoveMember(chatId, member._id);
										},
									},
								]}
								header="Remove Member"
								onDidDismiss={() => setOpenAlert(false)}
							></IonAlert>
						</div>
					);
				})}
				<SearchUsers
					placeholder="Search Users to add..."
					type="group"
					handleSelectUser={handleSelectUser}
					selectedUsers={selectedUsers}
					existingMembers={members}
					style={{ marginTop: '20px' }}
				/>
			</form>
		</div>
	);
};

export default ChatOptions;
