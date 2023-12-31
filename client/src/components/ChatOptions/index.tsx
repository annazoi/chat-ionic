import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import ImagePicker from "../ImagePicker";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import { set, useForm } from "react-hook-form";
import { useParams } from "react-router";
import { updatedChat, getChat } from "../../services/chat";
import { chatSchema } from "../../validations-schemas/chat";
import { ChatConfig } from "../../validations-schemas/interfaces/chat";
import SearchUsers from "../SearchUsers";
import { addCircle } from "ionicons/icons";

interface ChatOptionsProps {
  closeModal: () => void;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({ closeModal }) => {
  const { chatId } = useParams<{ chatId: string }>();

  const [filteredUser, setFilteredUser] = useState([]);
  const [members, setMembers] = useState<any[]>([]);

  const { register, handleSubmit, setValue, getValues, reset } =
    useForm<ChatConfig>({
      resolver: yupResolver(chatSchema),
    });

  const { mutate: mutateChat, isLoading: isChatLoading } = useMutation({
    mutationKey: ["chat-options"],
    mutationFn: (chatId: string) => getChat(chatId),
  });

  const { mutate: updatedMutate, isLoading: updatedIsLoading } = useMutation({
    mutationKey: ["chatInfo"],
    mutationFn: (newData: any) => updatedChat(chatId, newData),
    // onMutate: (newData: any) => {
    //   setMembers([...members, newData]);
    //   console.log("newData", newData);
    // },
  });

  // const { data, isLoading } = useQuery<any>({
  //   queryKey: ["chat"],
  //   refetchOnMount: "always",
  //   refetchIntervalInBackground: true,
  //   queryFn: () => getChat(chatId),
  //   onSuccess: (res: any) => {
  //     console.log("chat query", res.chat.messages);
  //   },
  // });

  const handleImage = (avatar: string) => {
    setValue("avatar", avatar);
  };

  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    try {
      mutateChat(chatId, {
        onSuccess: (data: any) => {
          console.log("chat", data.chat);
          setMembers(data?.chat.members);
          setAvatar(data?.chat.avatar);
          reset({
            avatar: avatar
              ? data?.chat.avatar
              : "https://img.myloview.de/bilder/people-vector-icon-person-symbol-work-group-team-persons-crowd-vector-illustration-icon-group-of-people-pictogram-isolated-illustration-of-people-icon-symbol-of-the-crowd-people-standing-next-700-223068863.jpg",
            name: data?.chat.name,
          });
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  }, []);

  const onSubmit = (data: any) => {
    try {
      const payload = {
        avatar: data.avatar,
        name: data.name,
        members: members,
      };
      updatedMutate(payload, {
        onSuccess: (res: any) => {
          console.log("success mutate", res);
          window.location.reload();
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
        {members.map((member: any, index: any) => {
          return (
            <div key={index} id={index}>
              <IonItem
                className="ion-no-margin ion-no-padding ion-margin-top "
                // routerLink={`/chat/${chat._id}`}
              >
                <IonAvatar>
                  <img src={member.avatar} alt="" />
                </IonAvatar>
                <IonTitle>{member.username}</IonTitle>
              </IonItem>
            </div>
          );
        })}
        <SearchUsers
          setFilteredUser={setFilteredUser}
          placeholder="Add members"
          className="ion-no-margin ion-no-padding ion-margin-top"
        />
        {filteredUser.map((user: any, index: number) => (
          <IonCard
            key={index}
            className="ion-no-margin ion-margin-top"
            onClick={() => {
              setMembers([...members, user]);
              console.log("member", members);
            }}

            // remove member from chat
            // onClick={() => {
            //   setMember(member.filter((m) => m._id !== user._id));
            //   console.log("member", member);
            // }}
          >
            <IonCardContent className="ion-no-padding">
              <IonItem lines="none">
                <IonAvatar slot="start">
                  <IonImg src={user.avatar} />
                </IonAvatar>
                <IonLabel>{user.username}</IonLabel>
                <IonIcon icon={addCircle}></IonIcon>
              </IonItem>
            </IonCardContent>
          </IonCard>
        ))}
      </form>
    </div>
  );
};

export default ChatOptions;
