import {
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonToolbar,
  IonButton,
  useIonRouter,
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonPopover,
  IonItem,
  IonToast,
} from "@ionic/react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../../../services/auth";
import { LoginConfig } from "../../../validations-schemas/interfaces/user";
import { authStore } from "../../../store/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../../validations-schemas/auth";
import HidePassword from "../../../components/HidePassword";
import Toast from "../../../components/ui/Toast";
import Logo from "../../../assets/logo.png";
import "./style.css";
import Title from "../../../components/ui/Title";
import Input from "../../../components/ui/Input";

const Login: React.FC = () => {
  const router = useIonRouter();

  const { logIn } = authStore((store: any) => store);

  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginConfig>({
    defaultValues: {
      username: "",
      password: "",
    },
    resolver: yupResolver(loginSchema),
  });

  const { mutate, isLoading, isError } = useMutation({
    mutationFn: loginUser,
  });

  const onSubmit = async (data: any) => {
    try {
      mutate(data, {
        onSuccess: (data: any) => {
          logIn({
            token: data.token,
            userId: data.userId,
            avatar: data.avatar,
            username: data.username,
          });
          setMessage("Form submitted successfully!");
          setShowToast(true);
          router.push("/inbox", "forward", "replace");
          window.location.reload();
        },

        onError: (error: any) => {
          setMessage("Could not login. Ckeck your credentials");
          setShowToast(true);
          console.log("error", error);
        },
      });
    } catch (error: any) {
      console.log("error", error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <Title title="Login" className="ion-padding" />
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
                label="Username"
                register={register("username", { required: true })}
              ></Input>
              {errors.username && (
                <div className="auth-error-box">
                  <p className="auth-error-text">{errors.username?.message}</p>
                </div>
                // <p className="auth-error">{errors.username?.message}</p>
              )}
              <HidePassword register={register} />
              {errors.password && (
                <div className="auth-error-box">
                  <p className="auth-error-text">{errors.password?.message}</p>
                </div>
              )}
              <IonButton
                type="submit"
                className="ion-margin-top"
                expand="block"
                disabled={isLoading}
                color={isLoading ? "medium" : "primary"}
              >
                Login
              </IonButton>
            </form>

            <Toast
              showToast={showToast}
              message={message}
              setShowToast={setShowToast}
              isError={isError}
            />
          </IonCardContent>
          <IonButton
            routerLink="/register"
            fill="clear"
            expand="block"
            id="click-trigger"
          >
            Create New Account
          </IonButton>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Login;
