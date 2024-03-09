import {
  IonAvatar,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonProgressBar,
  IonTitle,
  IonAlert,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import ImagePicker from "../ImagePicker";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { set, useForm } from "react-hook-form";
import { useParams } from "react-router";
import { updatedChat, addMembers, removeMember } from "../../services/chat";
import { chatSchema } from "../../validations-schemas/chat";
import { ChatConfig } from "../../validations-schemas/interfaces/chat";
import SearchUsers from "../SearchUsers";
import userDefaultAvatar from "../../assets/user.png";
import { closeOutline } from "ionicons/icons";

interface ChatOptionsProps {
  closeModal: () => void;
  mutateChat?: any;
  chat?: any;
  isLoading?: boolean;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({
  closeModal,
  mutateChat,
  chat,
  isLoading,
}) => {
  const { chatId } = useParams<{ chatId: string }>();
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);

  const { register, handleSubmit, setValue, getValues, reset } =
    useForm<ChatConfig>({
      resolver: yupResolver(chatSchema),
    });

  const { mutate: updatedMutate, isLoading: updatedIsLoading } = useMutation({
    mutationFn: (newData: any) => updatedChat(chatId, newData),
  });

  const { mutate: addMembersMutate } = useMutation({
    mutationFn: (members: string[]) => addMembers(chatId, members),
  });

  const { mutate: removeMemberMutate } = useMutation({
    mutationFn: (memberId: string) => removeMember(chatId, memberId),
  });
  useEffect(() => {
    mutateChat(chatId);
  }, []);

  useEffect(() => {
    try {
      mutateChat(chatId, {
        onSuccess: (data: any) => {
          setAvatar(data?.chat.avatar);
          setMembers(data?.chat.members);
          reset({
            avatar: avatar ? data?.chat.avatar : "",
            name: data?.chat.name,
          });
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  }, []);

  const handleImage = (avatar: string) => {
    setValue("avatar", avatar);
  };

  const handleSelectUser = (e: any, userId: string) => {
    if (e.detail.checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((user) => user !== userId));
    }
  };

  const handleAddMembers = () => {
    try {
      addMembersMutate(selectedUsers, {
        onSuccess: (res: any) => {
          closeModal();
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const handleRemoveMember = (chatId: string, memberId: string) => {
    try {
      removeMemberMutate(memberId, {
        onSuccess: (res: any) => {
          // closeModal();
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const onSubmit = (data: any) => {
    try {
      updatedMutate(data, {
        onSuccess: (res: any) => {
          handleAddMembers();
          closeModal();
        },

        onError: (error: any) => {
          console.log("error", error);
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      {!isLoading && <IonProgressBar type="indeterminate"></IonProgressBar>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <ImagePicker
          onChange={handleImage}
          register={register}
          value={getValues("avatar")}
        ></ImagePicker>
        <IonInput
          fill="outline"
          labelPlacement="floating"
          label="Change name"
          className="ion-margin-top"
          {...register("name", { required: true })}
        />
        <IonButton type="submit" expand="block" className="ion-margin-top">
          {updatedIsLoading ? "Updating..." : "Update"}
        </IonButton>
        {chat?.members.map((member: any, index: any) => {
          return (
            <div key={index} id={index}>
              <IonItem>
                <IonAvatar>
                  <img
                    src={member.avatar ? member.avatar : userDefaultAvatar}
                    alt=""
                  />
                </IonAvatar>
                <IonTitle>{member.username}</IonTitle>
                <IonIcon
                  icon={closeOutline}
                  onClick={() => {
                    setOpenAlert(true);
                  }}
                ></IonIcon>
              </IonItem>
              <IonAlert
                isOpen={openAlert}
                message="Are you sure you want to remove this member?"
                buttons={[
                  "cancel",
                  {
                    text: "Delete",
                    handler: () => {
                      handleRemoveMember(chatId, member._id);
                    },
                  },
                ]}
                header="Remove Member"
                onDidDismiss={() => setOpenAlert(false)}
              ></IonAlert>
            </div>
          );
        })}
        <SearchUsers
          placeholder="Search Users to add..."
          type="group"
          handleSelectUser={handleSelectUser}
          selectedUsers={selectedUsers}
          existingMembers={members}
        />
      </form>
    </div>
  );
};

export default ChatOptions;
