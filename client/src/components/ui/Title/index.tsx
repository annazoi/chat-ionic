import { IonTitle } from "@ionic/react";
import React from "react";

interface TitleProps {
  title: string;
  className?: string;
  color?: string;
}

const Title: React.FC<TitleProps> = ({ title, className, color }) => {
  return (
    <IonTitle
      className={className ? className : "ion-no-padding"}
      style={{
        fontWeight: "bold",
        letterSpacing: "2px",
        // textAlign: "center",
      }}
      color={color || "warning"}
    >
      {title}
    </IonTitle>
  );
};

export default Title;
