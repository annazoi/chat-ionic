import { IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import './style.css';
import Title from '../Title';
import Button from '../Button';
import { closeOutline } from 'ionicons/icons';

interface ModalProps {
	isOpen: any;
	title?: string;
	onClose: any;
	children?: any;
	closeModal?: any;
	image?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, closeModal }) => {
	return (
		<IonModal isOpen={isOpen} onDidDismiss={closeModal}>
			<IonHeader>
				<IonToolbar>
					{title && <Title title={title} className="ion-padding"></Title>}

					<IonButtons slot="end">
						<Button
							name="Close"
							iconSlot="end"
							icon={closeOutline}
							onClick={() => {
								onClose(false);
							}}
						></Button>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>{children}</IonContent>
		</IonModal>
	);
};

export default Modal;
