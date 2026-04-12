import api from './api';
import { Comment } from './likeService';

export const commentService = {
    async addComment(userId: string, username: string, articleUrl: string, text: string): Promise<{ status: string; comment: Comment }> {
        const { data } = await api.post('/news/comment', {
            user_id: userId,
            username: username,
            article_url: articleUrl,
            text: text,
        });
        return data;
    },
};
