import api from './api';

export const getProfile = async (userId: string) => {
    try {
        const response = await api.get(`/profile/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};
