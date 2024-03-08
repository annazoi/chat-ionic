import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuToggle,
  IonPage,
  IonProgressBar,
  IonTabBar,
  IonText,
  IonToolbar,
} from "@ionic/react";
import { authStore } from "../../store/auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { chatbubbleEllipsesOutline, create, sync } from "ionicons/icons";
import { getChats } from "../../services/chat";
import React from "react";
import CreateChat from "./CreateChat";
import Modal from "../../components/ui/Modal";
// import { useSocket } from "../../hooks/sockets";
import { RiGroup2Fill } from "react-icons/ri";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import Title from "../../components/ui/Title";
import Menu from "../../components/Menu";
import userDefaulfAvatar from "../../assets/user.png";
import Button from "../../components/ui/Button";
import { useNotifications } from "../../hooks/notifications";
import { io } from "socket.io-client";

const Chats: React.FC = () => {
  useNotifications();

  const { avatar, userId, username } = authStore((store: any) => store);

  const [openCreateChat, setOpenCreateChat] = useState<boolean>(false);
  const [isOpenChat, setIsOpenChat] = useState<boolean>(false);

  // const { socket } = useSocket();

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["chats"],
    queryFn: getChats,
    refetchOnMount: "always",
    refetchIntervalInBackground: true,
    refetchInterval: 1000,
    onSuccess: (data) => {
      console.log("data", data);
    },
  });

  // const joinRoom = (chatId: string) => {
  //   socket.emit("join_room", chatId);
  // };

  // useEffect(() => {
  //   socket?.on("new_message", (data: any) => {
  //     console.log("new message", data);
  //   });
  // }, [socket]);

  const handleLastMessage = (chat: any) => {
    const lastMessage = chat?.messages[chat.messages.length - 1];

    if (!lastMessage) {
      return "No messages yet";
    }
    if (lastMessage.senderId._id === userId) {
      return "You: " + lastMessage.message;
    } else {
      if (chat.type === "private") {
        return lastMessage.message;
      } else {
        return lastMessage.senderId.username + ": " + lastMessage.message;
      }
    }
  };

  const handleUnreadChats = () => {
    let unreadChats = 0;

    data?.forEach((chat: any) => {
      if (
        chat.messages[chat.messages.length - 1]?.read === false &&
        userId !== chat.messages[chat.messages.length - 1]?.senderId._id
      ) {
        unreadChats++;
      }
    });

    return unreadChats;
  };

  const getRefresh = () => {
    window.location.reload();
  };

  const getName = (chat: any) => {
    const member = chat.members.find((member: any) => member._id !== userId);
    return member.username;
  };

  const getAvatar = (chat: any) => {
    const member = chat.members.find((member: any) => member._id !== userId);
    if (!member.avatar) {
      return userDefaulfAvatar;
    } else {
      return member.avatar;
    }
  };

  return (
    <>
      <Menu />
      <IonPage id="main-content">
        <IonHeader>
          <IonToolbar>
            <IonMenuToggle>
              <img
                src={avatar ? avatar : userDefaulfAvatar}
                alt=""
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  marginLeft: "10px",
                  boxShadow: "0px 0px 8px 0px #000000",
                }}
              ></img>
            </IonMenuToggle>
            <IonButtons slot="end">
              <Title title={`${username}'s inbox`} />

              <IonButton
                slot="end"
                onClick={() => {
                  getRefresh();
                }}
              >
                <IonIcon icon={sync}></IonIcon>
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {data?.length === 0 ? (
            <IonCard style={{ margin: "20px" }}>
              <IonCardHeader
                style={{
                  letterSpacing: "3px",
                  fontSize: "14px",
                  color: "var(--ion-color-primary)",
                  textAlign: "center",
                }}
              >
                Click the button below to find a contact.
              </IonCardHeader>
            </IonCard>
          ) : (
            <div style={{ padding: "5px" }}>
              <p
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  paddingLeft: "4px",
                  color: "var(--ion-color-primary)",
                }}
              >
                Unread Chats({handleUnreadChats()})
              </p>
              {data?.map((chat: any, index: any) => {
                return (
                  <div key={index}>
                    {isLoading && (
                      <IonProgressBar type="indeterminate"></IonProgressBar>
                    )}
                    <IonItem
                      className="ion-no-padding"
                      // lines="none"
                      routerLink={`/chat/${chat._id}`}
                      onClick={() => {
                        // joinRoom(chat._id);
                      }}
                    >
                      <div style={{ display: "flex" }}>
                        {chat.type === "private" ? (
                          <IonAvatar>
                            <img
                              src={getAvatar(chat)}
                              alt=""
                              style={{
                                width: "37px",
                                height: "37px",
                                borderRadius: "50%",
                                marginLeft: "4px",
                                marginTop: "12px",
                              }}
                            />
                          </IonAvatar>
                        ) : (
                          <IonAvatar slot="start" className=" ion-no-margin">
                            <RiGroup2Fill size="100%" color="black" />
                          </IonAvatar>
                        )}

                        <div
                          style={
                            chat.messages[chat.messages.length - 1]?.read ===
                              false &&
                            userId !==
                              chat.messages[chat.messages.length - 1]?.senderId
                                ._id
                              ? {
                                  fontWeight: "bold",
                                  padding: "10px",
                                  display: "grid",
                                  width: "100%",
                                  gap: "5px",
                                }
                              : {
                                  fontWeight: "normal",
                                  padding: "10px",
                                  display: "grid",
                                  width: "100%",
                                  gap: "5px",
                                }
                          }
                        >
                          <IonLabel color="primary">
                            {chat.type === "private"
                              ? getName(chat)
                              : chat.name}
                          </IonLabel>
                          <IonText
                            style={{
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {handleLastMessage(chat)}
                          </IonText>
                        </div>
                      </div>
                    </IonItem>
                  </div>
                );
              })}
            </div>
          )}

          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton
              className="ion-no-margin"
              color="tertiary"
              // size="small"
              onClick={() => {
                setOpenCreateChat(true);
              }}
            >
              <IonIcon
                size="large"
                icon={chatbubbleEllipsesOutline}
                color="light"
              />
            </IonFabButton>
          </IonFab>
        </IonContent>

        <Modal
          isOpen={openCreateChat}
          onClose={setOpenCreateChat}
          title="New chat"
          closeModal={() => {
            setOpenCreateChat(false);
          }}
        >
          <CreateChat
            closeModal={() => {
              setOpenCreateChat(false);
            }}
            refetch={refetch}
          />
        </Modal>

        {/* <IonTabBar slot="bottom"></IonTabBar> */}
      </IonPage>
    </>
  );
};

export default Chats;
