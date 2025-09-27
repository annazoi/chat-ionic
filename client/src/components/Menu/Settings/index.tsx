import { IonCard, IonContent, IonIcon, IonItem, ToggleCustomEvent, IonAvatar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { authStore } from '../../../store/auth';
import { arrowForward, settings } from 'ionicons/icons';
import userDefaulfAvatar from '../../../assets/user.png';
import './style.css';
import Modal from '../../../components/ui/Modal';
import Account from './Account';
import Title from '../../../components/ui/Title';

const Settings: React.FC = () => {
	const { avatar, username } = authStore((store: any) => store);

	const [openAccount, setOpenAccount] = useState<boolean>(false);
	const [themeToggle, setThemeToggle] = useState(false);

	const toggleChange = (ev: ToggleCustomEvent) => {
		toggleDarkTheme(ev.detail.checked);
	};

	const toggleDarkTheme = (shouldAdd: boolean) => {
		document.body.classList.toggle('dark', shouldAdd);
	};

	const initializeDarkTheme = (isDark: boolean) => {
		setThemeToggle(isDark);
		toggleDarkTheme(isDark);
	};
	useEffect(() => {
		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		initializeDarkTheme(isDark);
	}, []);

	return (
		<IonContent className="settings-container">
			<IonCard className="settings-header">
				<IonAvatar>
					<img src={avatar ? avatar : userDefaulfAvatar}></img>
				</IonAvatar>
				<Title title={username} className="ion-padding"></Title>
			</IonCard>
			<IonCard>
				<IonItem
					onClick={() => {
						setOpenAccount(true);
					}}
				>
					<IonIcon
						icon={settings}
						slot="start"
						className="ion-no-margin"
						style={{ paddingRight: '15px' }}
					></IonIcon>
					Account Settings
					<IonIcon slot="end" icon={arrowForward}></IonIcon>
				</IonItem>
			</IonCard>

			<Modal isOpen={openAccount} onClose={setOpenAccount} title="Account Settings">
				<Account />
			</Modal>
		</IonContent>
	);
};

export default Settings;
