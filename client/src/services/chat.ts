import Axios from "axios";
import { API_URL } from "../constants";
import { getAuthState } from "../store/auth";

interface CreateChatConfig {
  name: string;
  type: string;
  avatar: string;
  members: string[];
}

const getConfig = () => {
  return {
    headers: {
      Authorization: `Bearer ${getAuthState().token}`,
    },
  };
};

export const createChat = async (payload: CreateChatConfig) => {
  try {
    const response = await Axios.post(
      `${API_URL}/chat`,
      {
        ...payload,
      },
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    throw err;
  }
};
export const getChats = async () => {
  try {
    const response = await Axios.get(`${API_URL}/chat`, getConfig());
    const sortedChats = response.data?.chats.sort((a: any, b: any) => {
      if (a.messages.length === 0) {
        return 1;
      }
      if (b.messages.length === 0) {
        return -1;
      }
      const aDate = new Date(a.messages[a.messages.length - 1]?.createdAt);
      const bDate = new Date(b.messages[b.messages.length - 1]?.createdAt);
      const latestDate = bDate.getTime() - aDate.getTime();
      return latestDate;
    });
    return sortedChats;
  } catch (err: any) {
    throw err;
  }
};
export const getChat = async (id: string) => {
  try {
    const response = await Axios.get(`${API_URL}/chat/${id}`, getConfig());
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const updatedChat = async (id: string, payload: any) => {
  try {
    const response = await Axios.put(
      `${API_URL}/chat/${id}`,
      { ...payload },
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const deleteChat = async (id: string) => {
  try {
    const response = await Axios.delete(`${API_URL}/chat/${id}`, getConfig());
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};
export const sendMessage = async ({
  chatId,
  newMessage,
  image,
}: {
  chatId: string;
  newMessage: string;
  image: string;
}) => {
  try {
    const response = await Axios.post(
      `${API_URL}/chat/${chatId}/message`,
      { message: newMessage, image },
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const deleteMessage = async (chatId: string, messageId: string) => {
  try {
    const response = await Axios.delete(
      `${API_URL}/chat/${chatId}/message/${messageId}`,
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const readMessage = async (chatId: string, messageId: string) => {
  try {
    const response = await Axios.put(
      `${API_URL}/chat/${chatId}/message/${messageId}`,
      {},
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const addMembers = async (chatId: string, members: string[]) => {
  try {
    const response = await Axios.post(
      `${API_URL}/chat/${chatId}/members`,
      { members },
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};

export const removeMember = async (chatId: string, memberId: string) => {
  try {
    const response = await Axios.delete(
      `${API_URL}/chat/${chatId}/members/${memberId}`,
      getConfig()
    );
    return response.data;
  } catch (err: any) {
    console.log("err", err);
    throw err;
  }
};
