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

  // const {
  //   mutate: userMutate,
  //   isLoading: isUserLoading,
  //   error: userError,
  // } = useMutation({
  //   mutationKey: ["user"],
  //   mutationFn: (userId: string) => getUser(userId),
  // });
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(userId),
  });

  const { mutate, isLoading, isError } = useMutation({
    mutationKey: ["updateUser"],
    mutationFn: (newData: any) => updateUser(userId, newData),
  });

  const handleImage = (avatar: string) => {
    setValue("avatar", avatar);
  };

  useEffect(() => {
    if (user) {
      reset(user?.user);
    }
  }, [user]);

  // useEffect(() => {
  //   try {
  //     user(userId, {
  //       onSuccess: (data: any) => {
  //         reset(data?.user);
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, []);

  const onSubmit = (data: RegisterConfig) => {
    try {
      mutate(data, {
        onSuccess: (data: any) => {
          updateStoreUser({
            avatar: data?.user.avatar,
            username: data?.user.username,
          });
          setMessage("Form submitted successfully!");
          setShowToast(true);
        },
        onError: (error) => {
          setMessage("Could not create user. The username already exists.");
          setShowToast(true);
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
          <Loading showLoading={isLoading} />
          <form onSubmit={handleSubmit(onSubmit)}>
            <IonInput
              fill="outline"
              labelPlacement="floating"
              label="Enter Username"
              className="ion-margin-top"
              {...register("username", { required: true })}
            />
            {errors.username && (
              <div className="auth-error-box">
                <p className="auth-error-text">{errors.username?.message}</p>
              </div>
            )}

            <IonInput
              fill="outline"
              labelPlacement="floating"
              label="Enter Phone"
              className="ion-margin-top"
              {...register("phone", { required: true })}
            />
            {errors.phone && (
              <div className="auth-error-box">
                <p className="auth-error-text">{errors.phone?.message}</p>
              </div>
            )}

            <HidePassword register={register} />
            {errors.password && (
              <div className="auth-error-box">
                <p className="auth-error-text">{errors.password?.message}</p>
              </div>
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
            isError={isError}
          />
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
};

export default Settings;
