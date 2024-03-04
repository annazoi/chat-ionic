import {
  IonCard,
  IonContent,
  IonIcon,
  IonItem,
  IonToggle,
  ToggleCustomEvent,
} from "@ionic/react";
import React, { useContext, useEffect, useState } from "react";
import { authStore } from "../../../store/auth";
import {
  arrowForward,
  contrastOutline,
  eye,
  logIn,
  settings,
} from "ionicons/icons";
import userDefaulfAvatar from "../../../assets/user.png";

import Modal from "../../../components/ui/Modal";
import Account from "./Account";
import Title from "../../../components/ui/Title";
// import "./style.css";

const Settings: React.FC = () => {
  const { avatar, username } = authStore((store: any) => store);

  const [openAccount, setOpenAccount] = useState<boolean>(false);
  const [themeToggle, setThemeToggle] = useState(false);

  const toggleChange = (ev: ToggleCustomEvent) => {
    toggleDarkTheme(ev.detail.checked);
  };

  const toggleDarkTheme = (shouldAdd: boolean) => {
    document.body.classList.toggle("dark", shouldAdd);
  };

  // Check/uncheck the toggle and update the theme based on isDark
  const initializeDarkTheme = (isDark: boolean) => {
    setThemeToggle(isDark);
    toggleDarkTheme(isDark);
  };
  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    initializeDarkTheme(isDark);
  }, []);

  return (
    <IonContent>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <img
          src={avatar ? avatar : userDefaulfAvatar}
          className="image-preview"
        ></img>
        <Title title={username} className="ion-padding"></Title>
      </div>
      <IonCard>
        <IonItem
          onClick={() => {
            setOpenAccount(true);
          }}
        >
          <IonIcon
            icon={eye}
            slot="start"
            className="ion-no-margin"
            style={{ paddingRight: "15px" }}
          ></IonIcon>
          Active Status
          <IonIcon slot="end" icon={arrowForward}></IonIcon>
        </IonItem>
        <IonItem
          onClick={() => {
            setOpenAccount(true);
          }}
        >
          <IonIcon
            icon={settings}
            slot="start"
            className="ion-no-margin"
            style={{ paddingRight: "15px" }}
          ></IonIcon>
          Account Settings
          <IonIcon slot="end" icon={arrowForward}></IonIcon>
        </IonItem>
        <IonItem>
          <IonIcon
            icon={contrastOutline}
            slot="start"
            className="ion-no-margin"
            style={{ paddingRight: "15px" }}
          ></IonIcon>
          Dark Mode
          <IonToggle
            checked={themeToggle}
            onIonChange={toggleChange}
            justify="space-between"
            slot="end"
          ></IonToggle>
        </IonItem>
      </IonCard>

      <Modal
        isOpen={openAccount}
        onClose={setOpenAccount}
        title="Account Settings"
      >
        <Account />
      </Modal>
    </IonContent>
  );
};

export default Settings;
