import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { commentService } from '@/services/commentService';
import { historyService } from '@/services/historyService';
import { Comment, likeService } from '@/services/likeService';
import { Article, newsService } from '@/services/newsService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NewsDetailScreen() {
    const params = useLocalSearchParams<{
        id: string;
        title: string;
        description: string;
        content: string;
        url: string;
        urlToImage: string;
        publishedAt: string;
        sourceName: string;
        category: string;
    }>();

    const { user } = useAuth();
    const { theme } = useTheme();

    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const subTextColor = useThemeColor({}, 'secondaryText');
    const borderColor = useThemeColor({}, 'border');
    const tintColor = useThemeColor({}, 'tint');

    const [relatedNews, setRelatedNews] = useState<Article[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(true);

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const article: Article = {
        id: params.id || '',
        title: params.title || '',
        description: params.description || '',
        content: params.content || '',
        url: params.url || '',
        urlToImage: params.urlToImage || '',
        publishedAt: params.publishedAt || '',
        source: { name: params.sourceName || 'Bilinmiyor' },
        category: params.category || '',
    };

    // Geçmişe kaydet
    useEffect(() => {
        if (user?.id && article.id) {
            historyService.addToHistory(user.id, article).catch(() => { });
        }
    }, [user?.id, article.id]);

    // Beğeni ve yorum verilerini yükle
    useEffect(() => {
        if (article.url) {
            (async () => {
                try {
                    const data = await likeService.getNewsInfo(article.url, user?.id);
                    setLiked(data.is_liked);
                    setLikeCount(data.like_count);
                    setComments(data.comments);
                } catch (error) {
                    console.error('Error fetching news info:', error);
                }
            })();
        }
    }, [article.url, user?.id]);

    // İlgili haberleri yükle
    useEffect(() => {
        (async () => {
            try {
                const cat = article.category || '';
                const data = await newsService.getNews(cat === 'tümü' ? '' : cat, '');
                const filtered = data.articles.filter((a) => a.id !== article.id).slice(0, 10);
                setRelatedNews(filtered);
            } catch {
                setRelatedNews([]);
            } finally {
                setLoadingRelated(false);
            }
        })();
    }, [article.id]);

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const CATEGORY_COLORS: Record<string, string> = {
        teknoloji: '#3B82F6',
        ekonomi: '#10B981',
        spor: '#F59E0B',
        dünya: '#EF4444',
        bilim: '#8B5CF6',
        kültür: '#EC4899',
        sağlık: '#06B6D4',
        genel: '#64748B',
    };

    const categoryColor = CATEGORY_COLORS[article.category?.toLowerCase()] ?? '#64748B';

    const handleRelatedPress = (relatedArticle: Article) => {
        router.push({
            pathname: '/news-detail' as any,
            params: {
                id: relatedArticle.id,
                title: relatedArticle.title,
                description: relatedArticle.description || '',
                content: relatedArticle.content || '',
                url: relatedArticle.url || '',
                urlToImage: relatedArticle.urlToImage || '',
                publishedAt: relatedArticle.publishedAt || '',
                sourceName: relatedArticle.source?.name || '',
                category: relatedArticle.category || '',
            },
        });
    };

    const handleLike = async () => {
        if (!user?.id) {
            alert('Beğenmek için giriş yapmalısınız.');
            return;
        }
        try {
            const result = await likeService.toggleLike(
                user.id,
                article.id,
                article.url,
                article.title,
                article.urlToImage,
                article.description,
                article.content,
                article.source?.name,
                article.publishedAt,
                article.category
            );
            setLiked(result.liked);
            setLikeCount(prev => (result.liked ? prev + 1 : prev - 1));
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleAddComment = async () => {
        if (!user?.id) {
            alert('Yorum yapmak için giriş yapmalısınız.');
            return;
        }
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const result = await commentService.addComment(user.id, user.name || 'Misafir', article.url, commentText);
            setComments(prev => [result.comment, ...prev]);
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Yorum eklenirken bir hata oluştu.');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Floating Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme === 'dark' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)' }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={22} color={textColor} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Image */}
                {article.urlToImage ? (
                    <View style={styles.heroContainer}>
                        <Image
                            source={{ uri: article.urlToImage }}
                            style={styles.heroImage}
                            resizeMode="cover"
                        />
                        <View style={styles.heroOverlay} />
                    </View>
                ) : (
                    <View style={[styles.heroPlaceholder, { backgroundColor: categoryColor + '33' }]}>
                        <Text style={styles.heroPlaceholderIcon}>📰</Text>
                    </View>
                )}

                {/* Content Area */}
                <View style={[styles.contentWrapper, { backgroundColor }]}>
                    <View style={styles.mainContent}>
                        {/* Category & Date */}
                        <View style={styles.metaRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
                                <Text style={[styles.categoryText, { color: categoryColor }]}>
                                    {article.category?.toUpperCase() ?? 'HABER'}
                                </Text>
                            </View>
                            <Text style={[styles.dateText, { color: subTextColor }]}>
                                {formatDate(article.publishedAt)}
                            </Text>
                        </View>

                        {/* Like and Actions Row */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: liked ? '#EF444415' : cardColor }]}
                                onPress={handleLike}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={liked ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={liked ? '#EF4444' : textColor}
                                />
                                <Text style={[styles.actionCount, { color: liked ? '#EF4444' : subTextColor }]}>
                                    {likeCount} Beğeni
                                </Text>
                            </TouchableOpacity>

                            <View style={[styles.actionButton, { backgroundColor: cardColor }]}>
                                <Ionicons name="chatbubble-outline" size={18} color={textColor} />
                                <Text style={[styles.actionCount, { color: subTextColor }]}>
                                    {comments.length} Yorum
                                </Text>
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={[styles.title, { color: textColor }]}>{article.title}</Text>

                        {/* Source */}
                        <View style={styles.sourceRow}>
                            <View style={[styles.sourceDot, { backgroundColor: tintColor }]} />
                            <Text style={[styles.sourceText, { color: subTextColor }]}>
                                {article.source?.name}
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={[styles.divider, { backgroundColor: borderColor }]} />

                        {/* Description */}
                        {article.description ? (
                            <Text style={[styles.description, { color: textColor }]}>
                                {article.description}
                            </Text>
                        ) : null}

                        {/* Content */}
                        {article.content ? (
                            <Text style={[styles.content, { color: subTextColor }]}>
                                {article.content.replace(/\[\+\d+ chars\]/, '')}
                            </Text>
                        ) : null}

                        {/* Read Full Article Button */}
                        {article.url ? (
                            <TouchableOpacity
                                style={[styles.readFullBtn, { backgroundColor: tintColor }]}
                                onPress={() => {
                                    // Linking.openURL(article.url)
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="open-outline" size={18} color="#fff" />
                                <Text style={styles.readFullText}>Tam Haberi Oku</Text>
                            </TouchableOpacity>
                        ) : null}

                        {/* Comments Section */}
                        <View style={styles.commentsSection}>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.relatedAccent, { backgroundColor: tintColor }]} />
                                <Text style={[styles.relatedTitle, { color: textColor }]}>
                                    Yorumlar ({comments.length})
                                </Text>
                            </View>

                            {/* Add Comment Input */}
                            <View style={[styles.addCommentContainer, { backgroundColor: cardColor, borderColor }]}>
                                <TextInput
                                    style={[styles.commentInput, { color: textColor }]}
                                    placeholder="Düşüncelerini paylaş..."
                                    placeholderTextColor={subTextColor}
                                    multiline
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: tintColor, opacity: !commentText.trim() || submittingComment ? 0.6 : 1 }]}
                                    onPress={handleAddComment}
                                    disabled={!commentText.trim() || submittingComment}
                                >
                                    {submittingComment ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="send" size={16} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* Comments List */}
                            {comments.length === 0 ? (
                                <Text style={[styles.noComments, { color: subTextColor }]}>
                                    Henüz yorum yapılmamış.
                                </Text>
                            ) : (
                                <View style={styles.commentsList}>
                                    {comments.map((comment) => (
                                        <View key={comment._id} style={[styles.commentCard, { backgroundColor: cardColor + '50' }]}>
                                            <View style={styles.commentHeader}>
                                                <Text style={[styles.commentUser, { color: textColor }]}>{comment.username}</Text>
                                                <Text style={[styles.commentDate, { color: subTextColor }]}>
                                                    {formatDate(comment.created_at)}
                                                </Text>
                                            </View>
                                            <Text style={[styles.commentText, { color: textColor }]}>{comment.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Sidebar / Recommended News */}
                    <View style={styles.sidebar}>
                        <View style={styles.sidebarHeader}>
                            <View style={[styles.sidebarAccent, { backgroundColor: tintColor }]} />
                            <Text style={[styles.sidebarTitle, { color: textColor }]}>Önerilenler</Text>
                        </View>

                        {loadingRelated ? (
                            <ActivityIndicator size="small" color={tintColor} />
                        ) : (
                            relatedNews.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.sidebarCard, { backgroundColor: cardColor, borderColor }]}
                                    onPress={() => handleRelatedPress(item)}
                                    activeOpacity={0.7}
                                >
                                    {item.urlToImage && (
                                        <Image source={{ uri: item.urlToImage }} style={styles.sidebarImage} />
                                    )}
                                    <Text style={[styles.sidebarCardTitle, { color: textColor }]} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 16,
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
    },
    heroContainer: {
        width: '100%',
        height: 300,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    heroPlaceholder: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroPlaceholderIcon: {
        fontSize: 56,
    },
    contentWrapper: {
        flexDirection: 'row',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingTop: 28,
        paddingBottom: 40,
        gap: 20,
        paddingHorizontal: 20,
    },
    mainContent: {
        flex: 2,
    },
    sidebar: {
        flex: 0.9,
        borderLeftWidth: 1,
        borderLeftColor: '#E2E8F022',
        paddingLeft: 16,
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sidebarAccent: {
        width: 3,
        height: 16,
        borderRadius: 2,
    },
    sidebarTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    sidebarCard: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    sidebarImage: {
        width: '100%',
        height: 60,
    },
    sidebarCardTitle: {
        fontSize: 10,
        fontWeight: '700',
        padding: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    dateText: {
        fontSize: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 30,
        marginBottom: 12,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    sourceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    sourceText: {
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        lineHeight: 26,
        marginBottom: 16,
        fontWeight: '500',
    },
    content: {
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 24,
    },
    readFullBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        marginBottom: 32,
    },
    readFullText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    relatedSection: {
        marginTop: 8,
    },
    relatedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    relatedAccent: {
        width: 4,
        height: 22,
        borderRadius: 2,
    },
    relatedTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    noRelated: {
        fontSize: 14,
        marginTop: 12,
    },
    relatedGrid: {
        gap: 12,
    },
    relatedCard: {
        flexDirection: 'row',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    relatedImage: {
        width: 110,
        height: 90,
    },
    relatedImagePlaceholder: {
        width: 110,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    relatedCardBody: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    relatedCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    relatedCardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    relatedCardSource: {
        fontSize: 11,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    actionCount: {
        fontSize: 13,
        fontWeight: '600',
    },
    commentsSection: {
        marginTop: 0,
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    addCommentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
        gap: 10,
    },
    commentInput: {
        flex: 1,
        fontSize: 14,
        maxHeight: 100,
        paddingTop: 0,
        paddingBottom: 0,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noComments: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
        fontStyle: 'italic',
    },
    commentsList: {
        gap: 16,
    },
    commentCard: {
        padding: 16,
        borderRadius: 16,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentUser: {
        fontSize: 14,
        fontWeight: '700',
    },
    commentDate: {
        fontSize: 11,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
