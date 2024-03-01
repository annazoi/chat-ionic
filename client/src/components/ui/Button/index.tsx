import { IonButton, IonIcon } from "@ionic/react";
import React from "react";

interface ButtonProps {
  name?: string;
  onClick?: () => void;
  icon?: any;
  iconSlot?: string;
  routerLink?: string;
  size?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  name,
  icon,
  iconSlot,
  routerLink,
  size,
}) => {
  return (
    <IonButton
      onClick={onClick}
      expand="block"
      fill="solid"
      color="tertiary"
      shape="round"
      routerLink={routerLink}
    >
      <IonIcon icon={icon} slot={iconSlot} size={size}></IonIcon>
      {name}
    </IonButton>
  );
};

export default Button;
