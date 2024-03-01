import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
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
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import {
  arrowBack,
  send,
  peopleOutline,
  informationOutline,
  imagesOutline,
  people,
  ellipsisHorizontalOutline,
  trashBinOutline,
} from "ionicons/icons";
import { getChat, sendMessage, deleteChat } from "../../../services/chat";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { authStore } from "../../../store/auth";
import { useSocket } from "../../../hooks/sockets";
import MessageBox from "../../../components/MessageBox";
import userDefaulfAvatar from "../../../assets/user.png";

import "./style.css";
import Modal from "../../../components/ui/Modal";

import ChatOptions from "../../../components/ChatOptions";
import { RiGroup2Fill } from "react-icons/ri";
import Title from "../../../components/ui/Title";

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [openMembers, setOpenMembers] = useState<boolean>(false);

  const router = useIonRouter();

  const { userId } = authStore((store: any) => store);
  const { socket } = useSocket();

  const [chat, setChat] = useState<any>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["chat"],
    refetchOnMount: "always",
    refetchIntervalInBackground: true,
    queryFn: () => getChat(chatId),
    onSuccess: (res: any) => {
      console.log("chat query", res.chat.messages);
      setMessages(res.chat.messages);
      setChat(res.chat);
    },
  });
  const { mutate, isLoading: messageIsLoading } = useMutation({
    mutationFn: ({ chatId, newMessage }: any) =>
      sendMessage(chatId, newMessage),
  });

  const { mutate: mutateDeleteChat } = useMutation({
    mutationFn: ({ chatId }: any) => deleteChat(chatId),
  });

  useEffect(() => {
    socket?.emit("join_room", chatId);
  }, [socket]);

  useEffect(() => {
    socket?.on("receive_message", (message: any) => {
      console.log("receive_message", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  }, [socket]);

  useEffect(() => {
    let lastMessage: any = document?.getElementById?.(`${messages.length - 1}`);
    if (!lastMessage) return;
    lastMessage.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [messages]);

  const deletedChat = () => {
    mutateDeleteChat(
      { chatId },
      {
        onSuccess: (res: any) => {
          console.log("success mutate", res);
          router.push("/inbox", "forward", "replace");
        },
        onError: (error: any) => {
          console.log("error", error);
        },
      }
    );
  };

  const sendNewMessage = () => {
    if (newMessage === "") return;
    mutate(
      { chatId, newMessage },
      {
        onSuccess: (res: any) => {
          console.log("success mutate", res);
          const messageData = {
            ...res.chat.messages[res.chat.messages.length - 1],
            room: chatId,
          };
          socket?.emit("send_message", messageData);
          setMessages((prevMessages) => [...prevMessages, messageData]);
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
      sendNewMessage();
    }
  };

  const getAvatar = () => {
    const member = chat?.members.find((member: any) => member._id !== userId);
    if (!member.avatar) {
      return userDefaulfAvatar;
    }
    return member.avatar;
  };

  const getName = (chat: any) => {
    const member = chat?.members.find((member: any) => member._id !== userId);
    return member.username;
  };

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
                  {chat.type === "private" ? (
                    <img src={getAvatar()} alt="" />
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

      {isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
      <>
        {messages.map((message: any, index: any) => {
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
                src={message.senderId.avatar}
                style={{
                  borderRadius: "100%",
                  height: "20px",
                  width: "20px",
                  margin: "10px",
                  marginTop: "15px",
                }}
                alt=""
              />
              <MessageBox message={message}></MessageBox>
            </div>
          );
        })}
      </>

      <div
        style={{
          justifyItems: "flex-end",
        }}
      >
        <IonItem
          lines="none"
          style={{
            border: "1px solid #9b95ec",
            borderRadius: "10px",
            margin: "5px",
            boxShadow: "0px 0px 5px 0px #9b95ec",
          }}
        >
          <IonInput
            type="text"
            value={newMessage}
            placeholder="Aa..."
            onKeyPress={handleEnterPress}
            onIonChange={(event: any) => {
              setNewMessage(event.target.value);
            }}
          />
          <IonButton onClick={sendNewMessage} expand="block" fill="clear">
            {messageIsLoading ? (
              <IonIcon icon={ellipsisHorizontalOutline}></IonIcon>
            ) : (
              <IonIcon icon={send}></IonIcon>
            )}
          </IonButton>
        </IonItem>
      </div>
      <Modal
        isOpen={openMembers}
        onClose={setOpenMembers}
        title="Members"
        closeModal={() => {
          setOpenMembers(false);
        }}
      >
        <ChatOptions
          closeModal={() => {
            setOpenMembers(false);
          }}
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
          {data?.chat.type === "group" && (
            <IonFabButton
              onClick={() => {
                setOpenMembers(!openMembers);
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