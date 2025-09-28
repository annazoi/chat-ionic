import { IonAvatar, IonCard, IonCardContent, IonCheckbox, IonImg, IonItem, IonLabel, IonSearchbar } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState, useMemo } from 'react';
import { getUsers } from '../../services/users';
import { authStore } from '../../store/auth';
import userDefaultAvatar from '../../assets/user.png';
import './style.css';

interface SearchUsersProps {
	onUsersFiltered?: (users: any[]) => void;
	placeholder: any;
	className?: string;
	type?: string;
	handleSelectUser?: any;
	selectedUsers?: any[];
	existingMembers?: any[];
	style?: React.CSSProperties;
}

const SearchUsers: React.FC<SearchUsersProps> = ({
	placeholder,
	className,
	type,
	handleSelectUser,
	selectedUsers,
	onUsersFiltered,
	existingMembers,
	style,
}) => {
	const { userId } = authStore((store: any) => store);

	const [search, setSearch] = useState<string>('');

	const { data } = useQuery({
		queryKey: ['users'],
		queryFn: () => getUsers(),
		select: (data) => {
			const users = data.users.filter((user: any) => {
				return user.username.includes(search);
			});
			return users;
		},
	});

	const filteredUsers = useMemo(() => {
		if (!search) return [];
		return data?.filter((user: any) => {
			return user.username.includes(search);
		});
	}, [search]);

	const handleExistingUsers = useMemo(() => {
		if (existingMembers) {
			return data?.filter((user: any) => {
				return !existingMembers.some((existingMember: any) => existingMember._id === user._id);
			});
		} else {
			return data;
		}
	}, [existingMembers, data]);

	useEffect(() => {
		onUsersFiltered?.(filteredUsers || []);
	}, [filteredUsers]);

	useEffect(() => {
		// console.log("selectedUsers", selectedUsers);
	}, [selectedUsers]);

	return (
		<>
			<IonSearchbar
				onIonInput={(e) => setSearch(e.detail.value!)}
				value={search}
				debounce={1000}
				onIonClear={() => {
					setSearch('');
				}}
				placeholder={placeholder}
				className={`search-bar ${className}`}
				color="light"
				style={style}
			></IonSearchbar>
			{type === 'group' && (
				<IonCard className="search-users-container ">
					{handleExistingUsers?.map((user: any, index: number) => (
						<div key={index}>
							{user._id !== userId && (
								<IonCard color="secondary">
									<IonCardContent className="ion-no-padding searched-user">
										<IonItem lines="none" color="secondary">
											<IonAvatar slot="start">
												<IonImg src={user.avatar ? user.avatar : userDefaultAvatar} />
											</IonAvatar>
											<IonCheckbox
												labelPlacement="start"
												checked={selectedUsers?.includes(user._id)}
												onIonChange={(e) => handleSelectUser(e, user._id)}
											>
												<IonLabel>{user.username}</IonLabel>
											</IonCheckbox>
										</IonItem>
									</IonCardContent>
								</IonCard>
							)}
						</div>
					))}
				</IonCard>
			)}
		</>
	);
};

export default SearchUsers;
