import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonProgressBar,
  IonTabBar,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  arrowBack,
  send,
  peopleOutline,
  informationOutline,
  imagesOutline,
  ellipsisHorizontalOutline,
  trashBinOutline,
  cameraOutline,
  imageOutline,
  happy,
  happyOutline,
  documentTextOutline,
} from "ionicons/icons";
import {
  getChat,
  sendMessage,
  deleteChat,
  readMessage,
} from "../../../services/chat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import { authStore } from "../../../store/auth";
// import { useSocket } from "../../../hooks/sockets";
import MessageBox from "./MessageBox";
import userDefaulfAvatar from "../../../assets/user.png";

import "./style.css";
import Modal from "../../../components/ui/Modal";

import ChatOptions from "../../../components/ChatOptions";
import { RiGroup2Fill } from "react-icons/ri";
import Title from "../../../components/ui/Title";
import { useInterval } from "react-use";
import { boolean } from "yup";

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { userId } = authStore((store: any) => store);
  // const { socket } = useSocket();
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [chat, setChat] = useState<any>(null);
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [openTakePicture, setOpenTakePicture] = useState(false);
  const [image, setImage] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");

  const router = useIonRouter();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const isEntered = useRef(false);

  const { mutate: readMessageMutate } = useMutation({
    mutationFn: ({ chatId, messageId }: any) => readMessage(chatId, messageId),
  });

  const { mutate: mutateChat } = useMutation({
    mutationFn: () => getChat(chatId),
    onSuccess: (res: any) => {
      setIsLoading(true);
      setMessages(res?.chat.messages);
      setChat(res?.chat);
      if (res?.chat.messages.length > 0) {
        if (
          res?.chat.messages[res?.chat.messages.length - 1].senderId._id !==
            userId &&
          !res?.chat.messages[res?.chat.messages.length - 1].read
        ) {
          readMessageMutate({
            chatId,
            messageId: res?.chat.messages[res?.chat.messages.length - 1]._id,
          });
        }
      }
    },
  });

  const { mutate, isLoading: messageIsLoading } = useMutation({
    mutationFn: ({ chatId, newMessage, image }: any) =>
      sendMessage({ chatId, newMessage, image }),
  });

  const { mutate: mutateDeleteChat } = useMutation({
    mutationFn: ({ chatId }: any) => deleteChat(chatId),
  });

  useInterval(
    () => {
      if (isRunning && !openOptions) {
        mutateChat();
      }
    },
    isRunning ? 5000 : null
  );

  useEffect(() => {
    mutateChat();
  }, []);

  useEffect(() => {
    // console.log("isEntered", isEntered.current);
    if (!isEntered.current) {
      isEntered.current = true;
      contentRef?.current?.scrollToBottom();
      // console.log("scrollToBottom");
    }
  }, [messages, contentRef]);

  const deletedChat = () => {
    mutateDeleteChat(
      { chatId },
      {
        onSuccess: () => {
          router.push("/inbox", "forward", "replace");
        },
        onError: (error: any) => {
          console.log("error", error);
        },
      }
    );
  };

  const handleNewMessage = () => {
    if (newMessage === "" && !image) return;
    mutate(
      { chatId, newMessage, image },
      {
        onSuccess: (res: any) => {
          const messageData = {
            ...res.chat.messages[res.chat.messages.length - 1],
            // room: chatId,
          };
          // socket?.emit("send_message", messageData);
          setMessages((prevMessages) => [...prevMessages, messageData]);
          contentRef?.current?.scrollToBottom();
          setNewMessage("");
        },
        onError: (error: any) => {
          console.log("error", error);
        },
      }
    );
  };

  const handleEnterPress = (event: any) => {
    if (event.key === "Enter") {
      handleNewMessage();
    }
  };

  const handleInputChange = (event: any) => {
    const { value } = event.target;
    setIsRunning(event.target.value.length > 0);
    setNewMessage(value);
  };

  const getAvatar = () => {
    const member = chat?.members.find((member: any) => member._id !== userId);
    if (!member.avatar) {
      return userDefaulfAvatar;
    }
    return member.avatar;
  };

  const getName = (chat: any) => {
    if (chat.type === "private") {
      const member = chat?.members.find((member: any) => member._id !== userId);
      return member.username;
    } else {
      return chat.name;
    }
  };

  const handleGallery = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });

    let imageUrl = image.dataUrl;

    setImage(imageUrl || "");

    return imageUrl;
  };

  const handleCamera = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });

    let imageUrl = image.dataUrl;

    setImage(imageUrl || "");

    return imageUrl;
  };

  // sockets
  // useEffect(() => {
  //   socket?.emit("join_room", chatId);
  // }, [socket]);
  // useEffect(() => {
  //   socket?.on("receive_message", (message: any) => {
  //     console.log("receive_message", message);
  //     setMessages((prevMessages) => [...prevMessages, message]);
  //   });
  // }, [socket]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/inbox">
              <IonIcon icon={arrowBack} size="medium"></IonIcon>
            </IonBackButton>

            {chat && (
              <IonItem
                lines="none"
                className="ion-no-padding"
                color="secondary"
              >
                <IonAvatar>
                  {chat.type === "private" && <img src={getAvatar()} alt="" />}
                  {chat.type === "group" && chat.avatar ? (
                    <img src={chat.avatar} alt="" />
                  ) : (
                    <RiGroup2Fill size="100%" color="black" />
                  )}
                </IonAvatar>
                <Title title={getName(chat)} className="ion-padding"></Title>
              </IonItem>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {!isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
      <IonContent ref={contentRef} className="ion-padding-top">
        {messages &&
          messages.map((message: any, index: any) => {
            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection:
                    userId === message.senderId._id ? "row-reverse" : "row",
                  alignSelf:
                    userId === message.senderId._id ? "flex-end" : "flex-start",
                }}
              >
                <img
                  src={
                    message.senderId.avatar
                      ? message.senderId.avatar
                      : userDefaulfAvatar
                  }
                  style={{
                    borderRadius: "100%",
                    height: "20px",
                    width: "20px",
                    margin: "10px",
                    marginTop: "15px",
                  }}
                  alt=""
                />

                <MessageBox
                  message={message}
                  image={image}
                  chatId={chatId}
                  // refetch={refetch}
                ></MessageBox>
              </div>
            );
          })}
      </IonContent>

      <div
        style={{
          justifyItems: "flex-end",
          // borderRadius: "10px",
          // margin: "5px",
          boxShadow: "0px 0px 0px 0px var(--ion-color-primary)",
          // border: "1px solid var(--ion-color-primary)",
          display: "flex",
          backgroundColor: "var(--ion-color-secondary)",
        }}
      >
        <input
          type="text"
          value={newMessage}
          placeholder="Aa..."
          onKeyUp={handleEnterPress}
          // onIonChange={handleInputChange}
          onChange={handleInputChange}
          className="new-message-input"
          // checked={isRunning}
        />
        <IonButton
          onClick={handleNewMessage}
          expand="block"
          fill="clear"
          slot="end"
        >
          <IonIcon
            icon={messageIsLoading ? ellipsisHorizontalOutline : send}
          ></IonIcon>
        </IonButton>
      </div>
      <IonCard
        className="ion-no-margin"
        color="secondary"
        style={{
          padding: "5px",
          paddingLeft: "10px",
          display: "flex",
          // justifyContent: "space-between",
          flexDirection: "row",
          gap: "5px",
        }}
      >
        <IonButton
          onClick={handleGallery}
          className="ion-no-margin"
          shape="round"
          size="small"
        >
          <IonIcon icon={imageOutline} color="light" size="small"></IonIcon>
        </IonButton>
        <IonButton
          onClick={handleCamera}
          className="ion-no-margin"
          shape="round"
          size="small"
        >
          <IonIcon icon={cameraOutline} size="small" color="light"></IonIcon>
        </IonButton>

        <IonButton
          // onClick={handleGallery}
          className="ion-no-margin"
          shape="round"
          size="small"
        >
          <IonIcon
            icon={documentTextOutline}
            size="small"
            color="light"
          ></IonIcon>
        </IonButton>
        <IonButton
          // onClick={handleGallery}
          className="ion-no-margin"
          shape="round"
          size="small"
        >
          <IonIcon icon={happyOutline} size="small" color="light"></IonIcon>
        </IonButton>
        <div>{/* <img src={image} alt="" /> */}</div>
      </IonCard>
      <Modal
        isOpen={openOptions}
        onClose={setOpenOptions}
        title="Members"
        closeModal={() => {
          setOpenOptions(false);
        }}
      >
        <ChatOptions
          closeModal={() => {
            setOpenOptions(false);
          }}
          mutateChat={mutateChat}
          chat={chat}
          isLoading={isLoading}
        ></ChatOptions>
      </Modal>
      <IonFab slot="fixed" horizontal="end">
        <IonFabButton size="small" color="primary">
          <IonIcon icon={informationOutline}></IonIcon>
        </IonFabButton>
        <IonFabList side="bottom">
          <IonFabButton>
            <IonIcon icon={imagesOutline}></IonIcon>
          </IonFabButton>
          <IonFabButton
            onClick={() => {
              deletedChat();
            }}
            routerLink="/inbox"
          >
            <IonIcon icon={trashBinOutline}></IonIcon>
          </IonFabButton>
          {chat?.type === "group" && (
            <IonFabButton
              onClick={() => {
                setOpenOptions(!openOptions);
              }}
            >
              <IonIcon icon={peopleOutline}></IonIcon>
            </IonFabButton>
          )}
        </IonFabList>
      </IonFab>
    </IonPage>
  );
};

export default Chat;
