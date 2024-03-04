import { useMutation } from "@tanstack/react-query";

import {
  IonCard,
  IonCardContent,
  IonContent,
  IonAvatar,
  IonItem,
  IonLabel,
  IonImg,
  IonButton,
  useIonRouter,
  IonIcon,
} from "@ionic/react";
import { chatbubblesOutline } from "ionicons/icons";
import React, { useState } from "react";
import { authStore } from "../../../store/auth";
import { createChat } from "../../../services/chat";
import CreateGroup from "./CreateGroup";
import SearchUsers from "../../../components/SearchUsers";
import userDefaultAvatar from "../../../assets/user.png";

interface UsersProps {
  closeModal: any;
  refetch?: any;
}

const CreateChat: React.FC<UsersProps> = ({ closeModal, refetch }) => {
  const { userId, isLoggedIn, username } = authStore((store: any) => store);

  const [openGroupModal, setOpenGroupModal] = React.useState<boolean>(false);
  const [filteredUser, setFilteredUser] = useState([]);

  const router = useIonRouter();

  const { mutate } = useMutation({
    mutationFn: ({ name, type, avatar, members }: any) =>
      createChat({ name, type, avatar, members }),
  });

  const createPrivateChat = (index: number, memberId: string) => {
    mutate(
      { type: "private", members: [userId, memberId] },
      {
        onSuccess: (res: any) => {
          console.log(res);
          if (res.exist) {
            router.push(`/chat/${res.chatId}`);
          } else {
            router.push(`/chat/${res.chat._id}`);
            refetch();
          }
          closeModal();
        },
      }
    );
  };

  return (
    <>
      <IonContent>
        {isLoggedIn && (
          <>
            <IonCardContent>
              <SearchUsers
                setFilteredUser={setFilteredUser}
                placeholder="Search Users..."
              />
              <IonButton
                style={{ marginLeft: "8px" }}
                onClick={() => {
                  setOpenGroupModal(true);
                }}
              >
                Create a Group
              </IonButton>
              <>
                {filteredUser.map((user: any, index: number) => (
                  // <div key={user._id}>
                  //   {userId !== user._id && (
                  <IonCard
                    key={user._id}
                    onClick={() => {
                      createPrivateChat(index, user._id);
                    }}
                  >
                    <IonCardContent className="ion-no-padding">
                      <IonItem lines="none">
                        <IonAvatar slot="start">
                          <IonImg
                            src={user.avatar ? user.avatar : userDefaultAvatar}
                          />
                        </IonAvatar>
                        <IonLabel>{user.username}</IonLabel>
                        <IonIcon icon={chatbubblesOutline}></IonIcon>
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                  //   )}
                  // </div>
                ))}
              </>
            </IonCardContent>
          </>
        )}
      </IonContent>

      <CreateGroup
        closeModal={closeModal}
        setOpenGroupModal={() => {
          setOpenGroupModal(false);
        }}
        openGroupModal={openGroupModal}
      />
    </>
  );
};

export default CreateChat;
