import {
  IonButton,
  IonCard,
  IonCardSubtitle,
  IonAlert,
  IonCardContent,
  IonContent,
  IonPopover,
} from "@ionic/react";
import React, { useRef, useState } from "react";
import { authStore } from "../../../../store/auth";
import "./style.css";
import { deleteMessage } from "../../../../services/chat";
import { useMutation } from "@tanstack/react-query";
import Button from "../../../../components/ui/Button";
import { trashOutline } from "ionicons/icons";
import { useLongPress } from "react-use";
import { Tooltip as ReactTooltip } from "react-tooltip";

interface MessageConfig {
  message: any;
  refetch?: any;
  chatId?: string;
}

const MessageBox: React.FC<MessageConfig> = ({ message, refetch, chatId }) => {
  const { userId } = authStore((store: any) => store);
  const [timeOpen, setTimeOpen] = useState<boolean>(false);
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [onDeletedMessage, setOnDeletedMessage] = useState<boolean>(false);

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

  const handleDeleteEvent = () => {
    console.log("messageId", message._id);
    setOnDeletedMessage(true);
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
        {!onDeletedMessage && (
          <IonCard
            data-tooltip-id="message-tooltip"
            data-tooltip-content={message.createdAt}
            className={
              userId === message.senderId._id
                ? "userId-message"
                : "other-message"
            }
            onClick={handleDeleteEvent}
            {...longPressEvent}
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
        )}

        {onDeletedMessage && (
          <div className="deleted-message-box">user delete this message</div>
        )}

        <ReactTooltip
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
        />
        {/* {timeOpen && <p className="timer-box">{message.createdAt}</p>} */}
      </div>

      {openOptions && (
        <IonAlert
          isOpen={openOptions}
          message="Are you sure you want to delete this message?"
          buttons={[
            "cancel",
            { text: "Delete", handler: () => handleDeleteMessage(message._id) },
          ]}
          header="Delete Message"
          onDidDismiss={() => setOpenOptions(false)}
        ></IonAlert>
      )}
    </>
  );
};

export default MessageBox;
