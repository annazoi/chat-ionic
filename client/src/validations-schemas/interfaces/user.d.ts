export interface RegisterConfig {
  phone: string;
  username: string;
  password: string;
  avatar?: string | undefined;
}

export interface LoginConfig {
  username: string;
  password: string;
}

export interface UserConfig {
  _id: string;
  phone: string;
  username: string;
  password: string;
  avatar?: string | undefined;
}
