import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
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
import { arrowForward } from "ionicons/icons";
import { useSocket } from "../../hooks/sockets";

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

  const handleLogout = () => {
    logOutUser();
  };

  const refresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    socket?.on("new_message", (data: any) => {
      console.log("new message", data);
    });
  }, [socket]);

  const LastMessage = ({ messages, length }: any) => {
    const lastMessage = messages[length - 1];
    return (
      <>
        {lastMessage === undefined ? (
          <IonLabel>You have no messages yet.</IonLabel>
        ) : (
          <IonLabel>
            {lastMessage.senderId._id === userId
              ? "You: " + lastMessage.message
              : lastMessage.message}
          </IonLabel>
        )}
      </>
    );
  };

  const sortChats = (chats: any) => {
    const sortedChats = chats.sort((a: any, b: any) => {
      if (a.messages.length === 0) {
        return 1;
      }
      if (b.messages.length === 0) {
        return -1;
      }
      const aDate = new Date(a.messages[a.messages.length - 1]?.createdAt);
      const bDate = new Date(b.messages[b.messages.length - 1]?.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
    return sortedChats;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{username}'s inbox</IonTitle>
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                refresh();
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
          <IonCard>
            <IonItem>
              <IonLabel>
                You have no chats yet. Click the button below to find a contact.
              </IonLabel>
            </IonItem>
          </IonCard>
        ) : (
          <>
            {data?.chats?.map((chat: any, index: any) => {
              sortChats(data.chats);
              return (
                <div key={index}>
                  {isLoading && (
                    <IonProgressBar type="indeterminate"></IonProgressBar>
                  )}
                  {chat.type === "private" ? (
                    <IonCard
                      className="ion-no-margin ion-no-padding"
                      routerLink={`/chat/${chat._id}`}
                      onClick={() => {
                        console.log("selected chat", chat);
                        joinRoom(chat._id);
                      }}
                    >
                      {chat.members.map((member: any, index: any) => {
                        return (
                          <div key={index}>
                            {member._id !== userId && (
                              <IonItem lines="none">
                                <IonAvatar slot="start">
                                  <IonImg src={member.avatar} />
                                </IonAvatar>
                                <div className="ion-margin">
                                  <IonLabel>{member.username}</IonLabel>
                                  <LastMessage
                                    messages={chat.messages}
                                    length={chat.messages.length}
                                  />
                                </div>
                                <IonIcon
                                  icon={arrowForward}
                                  slot="end"
                                ></IonIcon>
                              </IonItem>
                            )}
                          </div>
                        );
                      })}
                    </IonCard>
                  ) : (
                    <IonCard
                      className="ion-no-margin"
                      routerLink={`/chat/${chat._id}`}
                      onClick={() => {
                        joinRoom(chat._id);
                      }}
                    >
                      <IonItem lines="none">
                        <IonAvatar slot="start">
                          {!chat.avatar ? (
                            <IonIcon size={"large"} icon={people}></IonIcon>
                          ) : (
                            <IonImg src={chat.avatar} />
                          )}
                        </IonAvatar>
                        <div className="ion-margin">
                          <IonLabel>{chat.name}</IonLabel>
                          <LastMessage
                            messages={chat.messages}
                            length={chat.messages.length}
                          />
                        </div>
                        <IonIcon icon={arrowForward} slot="end"></IonIcon>
                      </IonItem>
                    </IonCard>
                  )}
                </div>
              );
            })}
          </>
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
