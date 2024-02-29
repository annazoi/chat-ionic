import {
  IonAvatar,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
} from "@ionic/react";
import React, { useRef, useState } from "react";
import { authStore } from "../../store/auth";
import "./style.css";

interface MessageConfig {
  message: any;
}

const MessageBox: React.FC<MessageConfig> = ({ message }) => {
  const { userId } = authStore((store: any) => store);
  const [timeOpen, setTimeOpen] = useState<boolean>(false);

  const toggleTime = () => {
    setTimeOpen(!timeOpen);
  };

  return (
    <>
      <IonCard
        className={
          userId === message.senderId._id ? "userId-message" : "other-message"
        }
        onClick={toggleTime}
      >
        <p
          style={{
            paddingLeft: "10px",
            paddingRight: "10px",
            color: userId === message.senderId._id ? "black" : "black",
          }}
        >
          {message.message}
        </p>
      </IonCard>
      {timeOpen && (
        <IonCardSubtitle color="dark">{message.createdAt}</IonCardSubtitle>
      )}
    </>
  );
};

export default MessageBox;
