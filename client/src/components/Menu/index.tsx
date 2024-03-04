import {
  IonContent,
  IonHeader,
  IonMenu,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from "@ionic/react";
import React, { useState } from "react";
import "./style.css";
import Settings from "./Settings";
import Modal from "../ui/Modal";
import { authStore } from "../../store/auth";
import Button from "../ui/Button";
import { create, globe, logOut, settings, sync } from "ionicons/icons";
import Title from "../ui/Title";

const Menu: React.FC = () => {
  const { logOutUser } = authStore((store: any) => store);
  const [openSettings, setOpenSettings] = useState<boolean>(false);

  // const router = useIonRouter();

  const handleLogout = () => {
    logOutUser();
    // router.push("/login", "forward", "replace");
  };
  return (
    <>
      <IonMenu contentId="main-content">
        <IonHeader>
          <IonToolbar color="secondary">
            <Title title="menu" className="ion-padding" color="light"></Title>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div
            style={{
              padding: "10px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Button
              name="Settings"
              onClick={() => {
                setOpenSettings(true);
              }}
              icon={settings}
              iconSlot="start"
            />
            <Button
              name="Logout"
              onClick={handleLogout}
              icon={logOut}
              iconSlot="start"
              routerLink="/login"
            ></Button>
          </div>
        </IonContent>
      </IonMenu>
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
    </>
  );
};

export default Menu;
