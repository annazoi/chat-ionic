import { IonAlert, IonContent, IonInput, useIonRouter } from '@ionic/react';
import { useMutation } from '@tanstack/react-query';
import { FC, useState } from 'react';
import { createChat } from '../../../../services/chat';
import { authStore } from '../../../../store/auth';
import ConfirmModal from '../../../../components/ConfirmModal';
import ImagePicker from '../../../../components/ImagePicker';
import SearchUsers from '../../../../components/SearchUsers';
interface GroupProps {
	closeModal: any;
	setOpenGroupModal: any;
	openGroupModal: any;
}

const CreateGroup: FC<GroupProps> = ({ closeModal, setOpenGroupModal, openGroupModal }) => {
	const { userId } = authStore((store: any) => store);
	const router = useIonRouter();
	const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
	const [name, setName] = useState<string>('');
	const [avatar, setAvatar] = useState<string>('');
	const [openAlert, setOpenAlert] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');

	const { mutate } = useMutation({
		mutationFn: ({ name, type, avatar, members }: any) => createChat({ name, type, avatar, members }),
	});

	const handleImage = (avatar: string) => {
		setAvatar(avatar);
	};

	const createGroupChat = () => {
		if (selectedUsers.length > 1 && name !== '') {
			mutate(
				{ name, type: 'group', avatar, members: [...selectedUsers, userId] },
				{
					onSuccess: (res: any) => {
						setOpenGroupModal(false);
						closeModal();
						console.log(res);
						router.push(`/chat/${res.chat._id}`);
					},
				}
			);
		} else if (selectedUsers.length <= 1) {
			setErrorMessage('Please select at least 2 users to create a group chat.');
			setOpenAlert(true);
		} else if (name === '') {
			setErrorMessage('Please selecte group name.');
			setOpenAlert(true);
		}
	};

	const handleSelectUser = (e: any, userId: string) => {
		if (e.detail.checked) {
			setSelectedUsers([...selectedUsers, userId]);
		} else {
			setSelectedUsers(selectedUsers.filter((user) => user !== userId));
		}
	};

	return (
		<ConfirmModal
			isOpen={openGroupModal}
			onClose={() => setOpenGroupModal(false)}
			onClick={createGroupChat}
			title="New Group"
		>
			<IonContent className="ion-padding">
				<ImagePicker onChange={handleImage} value={avatar} text="You can add a group image."></ImagePicker>
				<div style={{ padding: '8px', paddingTop: '20px' }}>
					<IonInput
						labelPlacement="floating"
						label="Enter group name"
						value={name}
						onIonChange={(e: any) => {
							setName(e.detail.value);
						}}
						className="input-container"
					></IonInput>
				</div>
				<SearchUsers
					type="group"
					placeholder="Search Users..."
					handleSelectUser={handleSelectUser}
					selectedUsers={selectedUsers}
				/>
				{/* 
        {filteredUser.map((user: any, index: any) => (
          <div key={index}>
            {user._id !== userId && (
              <IonCard>
                <IonCardContent className="ion-no-padding">
                  <IonItem lines="none">
                    <IonAvatar slot="start">
                      <IonImg
                        src={user.avatar ? user.avatar : userDefaultAvatar}
                      />
                    </IonAvatar>
                    <IonCheckbox
                      labelPlacement="start"
                      checked={selectedUser.includes(user._id)}
                      onIonChange={(e) => handleSelectUser(e, user._id)}
                      value={user._id}
                    >
                      <IonLabel>{user.username}</IonLabel>
                    </IonCheckbox>
                  </IonItem>
                </IonCardContent>
              </IonCard>
            )}
          </div>
        ))} */}
			</IonContent>
			<IonAlert
				isOpen={openAlert}
				message={errorMessage}
				buttons={['Close']}
				onDidDismiss={() => setOpenAlert(false)}
			></IonAlert>
		</ConfirmModal>
	);
};

export default CreateGroup;
