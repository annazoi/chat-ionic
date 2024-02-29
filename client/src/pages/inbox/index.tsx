import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonPage,
  IonProgressBar,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { authStore } from "../../store/auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { create, globe, logOut, people, settings, sync } from "ionicons/icons";
import { getChats } from "../../services/chat";
import React from "react";
import Users from "./CreateChat";
import Modal from "./Modal";
import Settings from "./Settings";
import { useSocket } from "../../hooks/sockets";
import { RiGroup2Fill } from "react-icons/ri";
import Title from "../../components/ui/Title";

const Inbox: React.FC = () => {
  const { logOutUser, avatar, userId, username } = authStore(
    (store: any) => store
  );

  const [openCreateChat, setOpenCreateChat] = useState<boolean>(false);
  const [openSettings, setOpenSettings] = useState<boolean>(false);

  const { socket } = useSocket();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["chats"],
    queryFn: getChats,
    refetchOnMount: "always",
  });

  const joinRoom = (chatId: string) => {
    socket.emit("join_room", chatId);
  };

  useEffect(() => {
    socket?.on("new_message", (data: any) => {
      console.log("new message", data);
    });
  }, [socket]);

  const handleLogout = () => {
    logOutUser();
  };

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

  const getRefresh = () => {
    window.location.reload();
  };

  const getName = (chat: any) => {
    const member = chat.members.find((member: any) => member._id !== userId);
    return member.username;
  };

  const getAvatar = (chat: any) => {
    const member = chat.members.find((member: any) => member._id !== userId);
    return member.avatar;
  };

  console.log("data", data);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <Title title={`${username}'s inbox`} />
          <IonButtons slot="start">
            <IonButton
              // color="primary"
              onClick={() => {
                getRefresh();
              }}
            >
              <IonIcon icon={sync}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonFab slot="fixed" horizontal="end" edge={true}>
        <IonFabButton size="small">
          <img
            src={avatar}
            alt=""
            style={{ width: "100%", height: "100%", borderRadius: "50%" }}
          ></img>
        </IonFabButton>
        <IonFabList side="bottom">
          <IonFabButton
            onClick={() => {
              setOpenSettings(true);
            }}
          >
            <IonIcon icon={settings}></IonIcon>
          </IonFabButton>

          <IonFabButton routerLink="/login" onClick={handleLogout}>
            <IonIcon icon={logOut}></IonIcon>
          </IonFabButton>
          <IonFabButton>
            <IonIcon icon={globe}></IonIcon>
          </IonFabButton>
        </IonFabList>
      </IonFab>
      <IonContent>
        {data?.chats?.length === 0 ? (
          <IonCard style={{ margin: "20px" }}>
            <IonCardHeader
              style={{
                letterSpacing: "2px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "var(--ion-color-primary-tint)",
                textAlign: "center",
              }}
            >
              Click the button below to find a contact.
            </IonCardHeader>
          </IonCard>
        ) : (
          <div>
            <p
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                paddingLeft: "10px",
                color: "var(--ion-color-primary)",
              }}
            >
              Messages({data?.chats.length})
            </p>
            {data?.chats?.map((chat: any, index: any) => {
              return (
                <div key={index}>
                  {isLoading && (
                    <IonProgressBar type="indeterminate"></IonProgressBar>
                  )}
                  <IonCard
                    style={{ borderRadius: "10px" }}
                    routerLink={`/chat/${chat._id}`}
                    onClick={() => {
                      console.log("selected chat", chat);
                      joinRoom(chat._id);
                    }}
                  >
                    <div>
                      <IonItem lines="none" style={{ padding: "3px" }}>
                        <IonAvatar slot="start" className=" ion-no-margin">
                          {chat.type === "private" ? (
                            <img
                              src={getAvatar(chat)}
                              style={{ width: "100%", height: "100%" }}
                              alt=""
                            />
                          ) : (
                            <RiGroup2Fill size="100%" />
                          )}
                        </IonAvatar>

                        <div
                          style={{
                            padding: "10px",
                            display: "grid",
                            width: "100%",
                            gap: "5px",
                          }}
                        >
                          <IonLabel style={{ fontWeight: "bold" }}>
                            {chat.type === "private"
                              ? getName(chat)
                              : chat.name}
                          </IonLabel>
                          <IonText style={{ fontSize: "14px" }}>
                            {handleLastMessage(chat)}
                          </IonText>
                        </div>
                      </IonItem>
                    </div>
                  </IonCard>
                </div>
              );
            })}
          </div>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonIcon
            icon={create}
            size="large"
            onClick={() => {
              setOpenCreateChat(true);
            }}
          ></IonIcon>
        </IonFab>
      </IonContent>

      <Modal
        isOpen={openCreateChat}
        onClose={setOpenCreateChat}
        title="New Message"
        closeModal={() => {
          setOpenCreateChat(false);
        }}
      >
        <Users
          closeModal={() => {
            setOpenCreateChat(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={openSettings}
        onClose={setOpenSettings}
        title="Settings"
        closeModal={() => {
          setOpenSettings(false);
        }}
      >
        <Settings />
      </Modal>
    </IonPage>
  );
};

export default Inbox;
