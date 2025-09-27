import { IonInput } from '@ionic/react';
import React from 'react';
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
			labelPlacement="floating"
			label={label}
			className={`input-container ${className}`}
			onIonChange={onIonChange}
		></IonInput>
	);
};

export default Input;
