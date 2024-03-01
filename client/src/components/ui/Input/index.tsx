import {
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React from "react";
type IonInputProps = React.ComponentProps<typeof IonInput>;

interface InputProps {
  fill?: string;
  placeholder?: string;
  labelPlacement?: string;
  label?: string;
  className?: string;
  props?: IonInputProps;
  icon?: any;
  register?: any;
  required?: boolean;
  error?: any;
  onIonChange?: any;
}

const Input: React.FC<InputProps> = ({
  fill,
  placeholder,
  labelPlacement,
  label,
  className,
  props,
  icon,
  register,
  required,
  error,
  onIonChange,
  ...rest
}) => {
  return (
    <IonInput
      {...register}
      {...props}
      {...rest}
      fill="outline"
      labelPlacement="floating"
      label={label}
      className={className || "ion-margin-top"}
      onIonChange={onIonChange}
    ></IonInput>
  );
};

export default Input;
