import { IonTitle } from "@ionic/react";
import React from "react";

interface TitleProps {
  title: string;
  className?: string;
}

const Title: React.FC<TitleProps> = ({ title, className }) => {
  return (
    <IonTitle
      className={className ? className : "ion-no-padding"}
      style={{
        fontWeight: "bold",
        letterSpacing: "2px",
        // textAlign: "center",
      }}
      color="primary"
    >
      {title}
    </IonTitle>
  );
};

export default Title;
