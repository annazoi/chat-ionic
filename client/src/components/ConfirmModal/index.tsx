import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import "./style.css";
import { addOutline, arrowBack } from "ionicons/icons";
import Button from "../ui/Button";
import Title from "../ui/Title";

interface ConfirmModalProps {
  isOpen: any;
  title: string;
  onClose: any;
  onClick?: any;
  children?: any;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  onClick,
  children,
}) => {
  return (
    <IonModal isOpen={isOpen}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                onClose(false);
              }}
            >
              <IonIcon icon={arrowBack} size="medium"></IonIcon>
            </IonButton>
          </IonButtons>
          <Title title={title}></Title>
          <IonButtons slot="end">
            <Button
              onClick={() => {
                onClick();
              }}
              name="create"
              iconSlot="end"
              icon={addOutline}
            ></Button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>{children}</IonContent>
    </IonModal>
  );
};

export default ConfirmModal;
