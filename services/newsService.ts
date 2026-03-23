import api from './api';

export interface Article {
    id: string;
    title: string;
    description: string;
    content: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: { name: string };
    category: string;
}

export interface NewsResponse {
    articles: Article[];
    total: number;
}

export const newsService = {
    async getNews(category = '', q = '', page = 1): Promise<NewsResponse> {
        const params: Record<string, string | number> = { page };
        if (category && category !== 'tümü') params.category = category;
        if (q) params.q = q;
        const { data } = await api.get<NewsResponse>('/news', { params });
        return data;
    },

    async getNewsDetail(id: string): Promise<Article> {
        const { data } = await api.get<Article>(`/news/${id}`);
        return data;
    },
};
