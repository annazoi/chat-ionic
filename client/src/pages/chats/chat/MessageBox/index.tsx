import { IonCard, IonCardSubtitle } from "@ionic/react";
import React, { useRef, useState } from "react";
import { authStore } from "../../../../store/auth";
import "./style.css";
import { deleteMessage } from "../../../../services/chat";
import { useMutation } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import { trashOutline } from "ionicons/icons";

interface MessageConfig {
  message: any;
  refetch?: any;
  chatId?: string;
}

const MessageBox: React.FC<MessageConfig> = ({ message, refetch, chatId }) => {
  const { userId } = authStore((store: any) => store);
  const [timeOpen, setTimeOpen] = useState<boolean>(false);

  const { mutate: mutateDeleteMessage } = useMutation({
    mutationFn: ({ chatId, messageId }: any) =>
      deleteMessage(chatId, messageId),
  });

  const handleDeleteMessage = (messageId: string) => {
    mutateDeleteMessage(
      { chatId, messageId },
      {
        onSuccess: (res: any) => {
          refetch();
        },
        onError: (error: any) => {
          console.log("error", error);
        },
      }
    );
  };

  const handleMessageOptions = () => {
    toggleTime();
  };

  const toggleTime = () => {
    setTimeOpen(!timeOpen);
  };

  return (
    <>
      <IonCard
        className={
          userId === message.senderId._id ? "userId-message" : "other-message"
        }
        onClick={handleMessageOptions}
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
        <>
          <div color="dark" className="timer-box">
            {message.createdAt}
          </div>
          {/* <Button onClick={() => handleDeleteMessage(message._id)}></Button> */}
        </>
      )}
    </>
  );
};

export default MessageBox;
