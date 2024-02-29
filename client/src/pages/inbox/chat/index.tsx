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

import "./style.css";
import Modal from "../Modal";

import ChatOptions from "../../../components/ChatOptions";
import { RiGroup2Fill } from "react-icons/ri";

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [newMessage, setNewMessage] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [openMembers, setOpenMembers] = useState<boolean>(false);

  const router = useIonRouter();

  const { userId } = authStore((store: any) => store);
  const { socket } = useSocket();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["chat"],
    refetchOnMount: "always",
    refetchIntervalInBackground: true,
    queryFn: () => getChat(chatId),
    onSuccess: (res: any) => {
      console.log("chat query", res.chat.messages);
      setMessages(res.chat.messages);
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/inbox">
              <IonIcon icon={arrowBack} size="medium"></IonIcon>
            </IonBackButton>

            {data?.chat.type === "private" ? (
              <>
                {data?.chat.members.map((member: any, index: any) => {
                  return (
                    <div key={index} id={index}>
                      {member._id !== userId && (
                        <IonItem>
                          <IonAvatar>
                            <img src={member.avatar} alt="" />
                          </IonAvatar>
                          <IonTitle>{member.username}</IonTitle>
                        </IonItem>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <IonItem>
                  <IonAvatar>
                    {!data?.chat.avatar ? (
                      <RiGroup2Fill size="100%" />
                    ) : (
                      <img src={data?.chat.avatar} alt="" />
                    )}
                  </IonAvatar>
                  <IonTitle>{data?.chat.name}</IonTitle>
                </IonItem>
              </>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonFab slot="fixed" horizontal="end">
        <IonFabButton size="small">
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
      <IonContent>
        <>
          {isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
          {messages.map((message: any, index: any) => {
            return (
              <div key={index} id={index} style={{ display: "flex" }}>
                <IonAvatar style={{ border: "1px solid" }}>
                  <img
                    src={message.senderId.avatar}
                    style={{ width: "100%" }}
                  />
                </IonAvatar>
                <MessageBox message={message}></MessageBox>
              </div>
            );
          })}
        </>

        <IonItem
          style={{
            border: "1px solid #e6e6e8",
            borderRadius: "10px",
            margin: "5px",
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
      </IonContent>
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
    </IonPage>
  );
};

export default Chat;
