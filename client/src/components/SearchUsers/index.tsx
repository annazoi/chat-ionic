import {
  IonAvatar,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonImg,
  IonItem,
  IonLabel,
  IonSearchbar,
} from "@ionic/react";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState, useMemo } from "react";
import { getUsers } from "../../services/users";
import { authStore } from "../../store/auth";
import userDefaultAvatar from "../../assets/user.png";

interface SearchUsersProps {
  onUsersFiltered?: (users: any[]) => void;
  placeholder: any;
  className?: string;
  type?: string;
  handleSelectUser?: any;
}

const SearchUsers: React.FC<SearchUsersProps> = ({
  placeholder,
  className,
  type,
  handleSelectUser,
  onUsersFiltered,
}) => {
  const { userId } = authStore((store: any) => store);

  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["users"],
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

  useEffect(() => {
    onUsersFiltered?.(filteredUsers || []);
  }, [filteredUsers]);

  return (
    <>
      <IonSearchbar
        onIonInput={(e) => setSearch(e.detail.value!)}
        value={search}
        debounce={1000}
        onIonClear={() => {
          setSearch("");
        }}
        placeholder={placeholder}
        className={className}
      ></IonSearchbar>
      {type === "group" && (
        <>
          {data?.map((user: any, index: number) => (
            <div key={index}>
              {user._id !== userId && (
                <IonCard>
                  <IonCardContent className="ion-no-padding">
                    <IonItem lines="none">
                      <IonAvatar slot="start">
                        <IonImg
                          src={user.avatar ? user.avatar : userDefaultAvatar}
                        />
                      </IonAvatar>
                      <IonCheckbox
                        labelPlacement="start"
                        checked={selectedUsers.includes(user._id)}
                        onIonChange={(e) => handleSelectUser(e, user._id)}
                        value={user._id}
                      >
                        <IonLabel>{user.username}</IonLabel>
                      </IonCheckbox>
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
};

export default SearchUsers;
