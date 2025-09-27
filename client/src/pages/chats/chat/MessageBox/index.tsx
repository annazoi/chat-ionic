import { IonCard, IonAlert } from '@ionic/react';
import React, { useState } from 'react';
import { authStore } from '../../../../store/auth';
import { deleteMessage } from '../../../../services/chat';
import { useMutation } from '@tanstack/react-query';
import { useLongPress } from 'react-use';
import { Tooltip as ReactTooltip } from 'react-tooltip';

import './style.css';
import Modal from '../../../../components/ui/Modal';
import { set } from 'react-hook-form';

interface MessageConfig {
	message?: any;
	refetch?: any;
	chatId?: string;
	image?: string;
}

const MessageBox: React.FC<MessageConfig> = ({ message, refetch, chatId, image }) => {
	const { userId } = authStore((store: any) => store);
	const [timeOpen, setTimeOpen] = useState<boolean>(false);
	const [openOptions, setOpenOptions] = useState<boolean>(false);
	const [onDeletedMessage, setOnDeletedMessage] = useState<boolean>(false);
	const [openImage, setOpenImage] = useState(false);

	const { mutate: mutateDeleteMessage } = useMutation({
		mutationFn: ({ chatId, messageId }: any) => deleteMessage(chatId, messageId),
	});

	const handleDeleteMessage = (messageId: string) => {
		mutateDeleteMessage(
			{ chatId, messageId },
			{
				onSuccess: (res: any) => {
					// refetch();
				},
				onError: (error: any) => {
					console.log('error', error);
				},
			}
		);
	};

	const handleMessageOptions = () => {
		setOpenOptions(true);
	};

	const toggleTime = () => {
		setTimeOpen(!timeOpen);
	};

	const onLongPress = () => {
		handleMessageOptions();
	};

	const defaultOptions = {
		isPreventDefault: true,
		delay: 300,
	};
	const longPressEvent = useLongPress(onLongPress, defaultOptions);

	return (
		<>
			<div>
				{timeOpen && <p className="timer-box">{message.createdAt}</p>}
				<IonCard
					data-tooltip-id="message-tooltip"
					data-tooltip-content={message.createdAt}
					className={userId === message.senderId._id ? 'userId-message' : 'sender-message'}
					onClick={message.message && !message.image ? toggleTime : () => setOpenImage(true)}
					{...longPressEvent}
				>
					{message.message && !message.image && (
						<p
							style={{
								paddingLeft: '10px',
								paddingRight: '10px',
								color: 'var(--ion-color-warning)',
							}}
						>
							{message.message}
						</p>
					)}
					{message.image && !message.message && (
						<img src={message.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					)}
				</IonCard>

				{/* <ReactTooltip
          id="message-tooltip"
          place="left"
          style={{
            backgroundColor: "var(--ion-color-secondary)",
            color: "white",
            padding: "6px",
            fontSize: "12px",
            fontWeight: "bold",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        /> */}
			</div>

			<Modal isOpen={openImage} onClose={() => setOpenImage(false)}>
				<img src={message.image} alt="" style={{ width: '100%' }} />
			</Modal>

			{openOptions && message.senderId._id === userId && (
				<IonAlert
					isOpen={openOptions}
					message="Are you sure you want to delete this message?"
					buttons={[
						'cancel',
						{
							text: 'Delete',
							handler: () => {
								handleDeleteMessage(message._id);
							},
						},
					]}
					header="Delete Message"
					onDidDismiss={() => setOpenOptions(false)}
				></IonAlert>
			)}
		</>
	);
};

export default MessageBox;
