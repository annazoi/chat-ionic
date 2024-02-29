import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./style.css";
import Title from "../Title";

interface ModalProps {
  isOpen: any;
  title: string;
  onClose: any;
  children?: any;
  closeModal?: any;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeModal,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={closeModal}>
      <IonHeader>
        <IonToolbar>
          <Title title="Settings" className="ion-padding"></Title>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                onClose(false);
              }}
            >
              <p style={{ fontWeight: "bold", letterSpacing: "2px" }}>CLOSE</p>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>{children}</IonContent>
    </IonModal>
  );
};

export default Modal;
