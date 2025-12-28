import { API_URL } from '../constants';
import Axios from 'axios';
import { getAuthState } from '../store/auth';

const getConfig = () => {
	return {
		headers: {
			Authorization: `Bearer ${getAuthState().token}`,
		},
	};
};

export const getChatSummary = async (id: string) => {
	try {
		const response = await Axios.post(`${API_URL}/openai/chats/${id}/summary`, {}, getConfig());
		return response.data;
	} catch (err: any) {
		throw err;
	}
};

export const getChatEmotions = async (id: string) => {
	try {
		const response = await Axios.post(`${API_URL}/openai/chats/${id}/emotions`, {}, getConfig());
		return response.data;
	} catch (err: any) {
		throw err;
	}
};
