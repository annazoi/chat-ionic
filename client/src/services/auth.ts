import {
  LoginConfig,
  RegisterConfig,
} from "../validations-schemas/interfaces/user";
import Axios from "axios";
import { API_URL } from "../constants";

export const registerUser = async (payload: RegisterConfig) => {
  try {
    if (payload.avatar === "") {
      payload.avatar =
        "https://iconape.com/wp-content/files/zk/367905/png/367905.png";
    } else {
      payload.avatar = payload.avatar;
    }

    const response = await Axios.post(`${API_URL}/auth/register`, {
      phone: payload.phone,
      username: payload.username,
      password: payload.password,

      avatar: payload.avatar,
    });
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const loginUser = async (payload: LoginConfig) => {
  try {
    const response = await Axios.post(`${API_URL}/auth/login`, {
      username: payload.username,
      password: payload.password,
    });
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};
