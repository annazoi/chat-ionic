import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonPage,
  IonProgressBar,
  IonRow,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { registerSchema } from "../../../validations-schemas/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../../../services/auth";
import { RegisterConfig } from "../../../validations-schemas/interfaces/user";
import ImagePicker from "../../../components/ImagePicker";
import { authStore } from "../../../store/auth";
import Toast from "../../../components/ui/Toast";
import Loading from "../../../components/Loading";
import { arrowBack } from "ionicons/icons";
import Logo from "../../../assets/logo.png";
import Title from "../../../components/ui/Title";

const Register: React.FC = () => {
  const { logIn } = authStore((store: any) => store);

  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterConfig>({
    defaultValues: {
      phone: "",
      username: "",
      password: "",
      avatar: "",
    },
    resolver: yupResolver(registerSchema),
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: registerUser,
  });

  const handleImage = (avatar: string) => {
    setValue("avatar", avatar);
    console.log("imag", avatar);
  };

  const router = useIonRouter();

  const onSubmit = async (data: any) => {
    console.log("dat", data);
    try {
      mutate(data, {
        onSuccess: (data: any) => {
          console.log("success", data);
          if (data.avatar === undefined || data.avatar === " ") {
            data.avatar = "";
          }
          logIn({
            token: data.token,
            userId: data.userId,
            avatar: data?.avatar,
            username: data.username,
          });
          setMessage("Form submitted successfully!");
          setShowToast(true);
          router.push("/inbox", "forward", "replace");
          // window.location.reload();
        },
        onError: (error) => {
          console.log("Could not create user", error);
        },
      });
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/login">
              <IonIcon icon={arrowBack} size="medium"></IonIcon>
            </IonButton>
          </IonButtons>
          <Title title="Register" />
        </IonToolbar>
      </IonHeader>
      <IonContent class="ion-padding">
        <IonCard
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "600px",
            justifyContent: "center",
            margin: "auto",
            padding: "20px",
            borderRadius: "30px",
            alignSelf: "center",
          }}
        >
          <img
            src={Logo}
            alt="logo"
            style={{
              borderRadius: "30px",
              width: "40%",
              padding: "10px",
              alignSelf: "center",
            }}
          ></img>

          <IonCardContent>
            {isLoading && (
              <IonProgressBar type="indeterminate"></IonProgressBar>
            )}
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

              <IonInput
                fill="outline"
                labelPlacement="floating"
                label="Enter New Password"
                className="ion-margin-top"
                type="password"
                {...register("password", { required: true })}
              />
              {errors.password && (
                <p style={{ color: "red" }}>{errors.password?.message}</p>
              )}
              <ImagePicker onChange={handleImage}></ImagePicker>

              <IonButton
                type="submit"
                className="ion-margin-top"
                expand="block"
                disabled={isLoading}
                color={isLoading ? "medium" : "primary"}
              >
                Register
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
    </IonPage>
  );
};

export default Register;
