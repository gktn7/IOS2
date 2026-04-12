import api from './api';
import { Article } from './newsService';

export interface HistoryArticle extends Article {
    viewed_at?: string;
}

export interface HistoryResponse {
    history: HistoryArticle[];
    total: number;
}

export const historyService = {
    async addToHistory(userId: string, article: Article): Promise<void> {
        await api.post('/history', {
            user_id: userId,
            article: {
                id: article.id,
                title: article.title,
                description: article.description,
                content: article.content,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source_name: article.source?.name,
                category: article.category,
            },
        });
    },

    async getHistory(userId: string): Promise<HistoryResponse> {
        const { data } = await api.get<HistoryResponse>(`/history/${userId}`);
        return data;
    },

    async clearHistory(userId: string): Promise<void> {
        await api.delete(`/history/${userId}`);
    },
};
