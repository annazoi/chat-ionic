import { IonContent, IonPage, IonToast } from "@ionic/react";
import React from "react";

interface ToastMessageProps {
  showToast: boolean;
  message: string;
  setShowToast: (show: boolean) => void;
  isError?: boolean;
}

const Toast: React.FC<ToastMessageProps> = ({
  showToast,
  message,
  setShowToast,
  isError = false,
}) => {
  return (
    <IonToast
      isOpen={showToast}
      onDidDismiss={() => setShowToast(false)}
      message={message}
      duration={2000}
      color={isError ? "danger" : "success"}
      style={{ height: "80%" }}
    ></IonToast>
  );
};

export default Toast;
