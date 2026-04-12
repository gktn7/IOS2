import api from './api';

export interface NewsInfoResponse {
    like_count: number;
    is_liked: boolean;
    comments: Comment[];
}

export interface Comment {
    _id: string;
    user_id: string;
    username: string;
    article_url: string;
    text: string;
    created_at: string;
}

export const likeService = {
    async getNewsInfo(articleUrl: string, userId?: string): Promise<NewsInfoResponse> {
        const params: Record<string, string> = { article_url: articleUrl };
        if (userId) params.user_id = userId;
        const { data } = await api.get<NewsInfoResponse>('/news/news-info', { params });
        return data;
    },

    async toggleLike(
        userId: string,
        articleId: string,
        articleUrl: string,
        articleTitle?: string,
        articleImage?: string,
        articleDescription?: string,
        articleContent?: string,
        articleSource?: string,
        articlePublishedAt?: string,
        articleCategory?: string
    ): Promise<{ liked: boolean }> {
        const { data } = await api.post('/news/like', {
            user_id: userId,
            article_id: articleId,
            article_url: articleUrl,
            article_title: articleTitle,
            article_image: articleImage,
            article_description: articleDescription,
            article_content: articleContent,
            article_source: articleSource,
            article_published_at: articlePublishedAt,
            article_category: articleCategory,
        });
        return data;
    },
};
