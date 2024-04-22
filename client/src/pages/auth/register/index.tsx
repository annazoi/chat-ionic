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
import HidePassword from "../../../components/HidePassword";
import Input from "../../../components/ui/Input";

const Register: React.FC = () => {
  const { logIn } = authStore((store: any) => store);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const { mutate, isLoading, isError } = useMutation({
    mutationFn: registerUser,
  });

  const handleImage = (avatar: string) => {
    setValue("avatar", avatar);
  };

  const router = useIonRouter();

  const onSubmit = async (data: any) => {
    try {
      mutate(data, {
        onSuccess: (data: any) => {
          if (data.avatar === undefined || data.avatar === " ") {
            data.avatar = "";
          }
          logIn({
            token: data.token,
            userId: data.userId,
            avatar: data?.avatar,
            username: data.username,
          });
          setToastMessage("Form submitted successfully!");
          setShowToast(true);
          router.push("/inbox", "forward", "replace");
          // window.location.reload();
        },
        onError: (error) => {
          setToastMessage(
            "Could not create user. The username already exists."
          );
          setShowToast(true);
        },
      });
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
        <IonCard className="auth-card">
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
              <Input
                label="Entrer Username"
                register={register("username", { required: true })}
              ></Input>
              {errors.username && (
                <div className="auth-error-box">
                  <p className="auth-error-text">{errors.username?.message}</p>
                </div>
              )}

              <Input
                label="Entrer Phone"
                register={register("phone", { required: true })}
              ></Input>
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
              message={toastMessage}
              setShowToast={setShowToast}
              isError={isError}
            />
          </IonCardContent>
          <IonButton routerLink="/login" fill="clear" expand="block">
            Login
          </IonButton>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Register;
