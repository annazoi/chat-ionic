import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonInput,
  IonItem,
} from "@ionic/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { getUser, updateUser } from "../../../../services/users";
import { authStore } from "../../../../store/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { logIn } from "ionicons/icons";
import { get, set, useForm } from "react-hook-form";
import ImagePicker from "../../../../components/ImagePicker";
import Loading from "../../../../components/Loading";
import Toast from "../../../../components/ui/Toast";
import { registerSchema } from "../../../../validations-schemas/auth";
import { RegisterConfig } from "../../../../validations-schemas/interfaces/user";
import { useEffect } from "react";
import userDefaultAvatar from "../../../../assets/user.png";
import HidePassword from "../../../HidePassword";

const Settings: React.FC = () => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<RegisterConfig>({
    resolver: yupResolver(registerSchema),
  });

  const {
    userId,
    updateUser: updateStoreUser,
    avatar: storeAvatar,
  } = authStore((store: any) => store);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [message, setMessage] = useState<any>("");
  const [useAvatar, setUseAvatar] = useState<string>("");

  const {
    mutate: userMutate,
    isLoading: isUserLoading,
    error: userError,
  } = useMutation({
    mutationKey: ["user"],
    mutationFn: (userId: string) => getUser(userId),
  });

  const { mutate, isLoading, error } = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: (newData: any) => updateUser(userId, newData),
  });

  const handleImage = (avatar: string) => {
    // if (avatar) {
    //   setValue("avatar", avatar);
    // } else {
    //   setValue("avatar", userDefaultAvatar);
    // }
    setValue("avatar", avatar);
  };

  useEffect(() => {
    try {
      userMutate(userId, {
        onSuccess: (data: any) => {
          console.log("user", data.user);
          reset(data?.user);
        },
      });
    } catch (error) {
      console.log(error);
    }
  }, []);

  const onSubmit = (data: RegisterConfig) => {
    try {
      mutate(data, {
        onSuccess: (data: any) => {
          updateStoreUser({
            avatar: data?.user.avatar,
            username: data?.user.username,
          });
          console.log("success", data);
          setMessage("Form submitted successfully!");
          setShowToast(true);
        },
        onError: (error) => {
          console.log("Could not create user", error);
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <IonContent>
      <IonCard>
        <IonCardContent>
          {isLoading && <Loading showLoading={isLoading} />}
          <form onSubmit={handleSubmit(onSubmit)}>
            <IonInput
              fill="outline"
              labelPlacement="floating"
              label="Enter Phone"
              className="ion-margin-top"
              {...register("phone", { required: true })}
            />
            {errors.phone && (
              <p style={{ color: "red" }}>{errors.phone?.message}</p>
            )}

            <IonInput
              fill="outline"
              labelPlacement="floating"
              label="Enter Username"
              className="ion-margin-top"
              {...register("username", { required: true })}
            />
            {errors.username && (
              <p style={{ color: "red" }}>{errors.username?.message}</p>
            )}

            <HidePassword register={register} />
            {errors.password && (
              <p style={{ color: "red" }}>{errors.password?.message}</p>
            )}
            <ImagePicker
              onChange={handleImage}
              register={register}
              value={storeAvatar ? getValues("avatar") : userDefaultAvatar}
            ></ImagePicker>

            <IonButton
              id="open-toast"
              type="submit"
              className="ion-margin-top"
              expand="block"
            >
              Confirm Changes
            </IonButton>
          </form>
          <Toast
            showToast={showToast}
            message={message}
            setShowToast={setShowToast}
          />
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
};

export default Settings;
