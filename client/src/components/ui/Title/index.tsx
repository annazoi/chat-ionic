import { IonTitle } from '@ionic/react';
import React from 'react';

interface TitleProps {
	title: string;
	className?: string;
	color?: string;
	style?: any;
}

const Title: React.FC<TitleProps> = ({ title, className, color, style }) => {
	return (
		<IonTitle
			className={className ? className : 'ion-no-padding'}
			style={{ fontWeight: 'bold', letterSpacing: '2px', color: 'white', ...style }}
			color={color || 'white'}
		>
			{title}
		</IonTitle>
	);
};

export default Title;
