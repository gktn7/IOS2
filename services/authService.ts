import api from './api';

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export const authService = {
    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/register', payload);
        return data;
    },

    async login(payload: LoginPayload): Promise<AuthResponse> {
        const { data } = await api.post<AuthResponse>('/auth/login', payload);
        return data;
    },
};
