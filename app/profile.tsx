import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getProfile } from '@/services/profileService';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface ProfileData {
    user: {
        name: string;
        email: string;
        created_at: string;
    };
    stats: {
        liked_count: number;
        comment_count: number;
    };
    likes: any[];
    comments: any[];
}

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { theme } = useTheme();

    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const subTextColor = useThemeColor({}, 'secondaryText');
    const borderColor = useThemeColor({}, 'border');

    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'likes' | 'comments'>('likes');

    useEffect(() => {
        if (user && 'id' in user && user.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            if (!user?.id) return;
            setLoading(true);
            const data = await getProfile(user.id);
            setProfileData(data);
        } catch (error) {
            Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Çıkış Yap',
                style: 'destructive',
                onPress: () => {
                    logout();
                    router.replace('/login');
                }
            },
        ]);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Bilinmiyor';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={{ fontSize: 24, color: textColor }}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Profil</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* User Info */}
                <View style={styles.userInfoSection}>
                    <View style={[styles.avatarContainer, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={styles.avatarText}>{profileData?.user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.userName, { color: textColor }]}>{profileData?.user.name}</Text>
                    <Text style={[styles.userEmail, { color: subTextColor }]}>{profileData?.user.email}</Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{profileData?.stats.liked_count || 0}</Text>
                        <Text style={[styles.statLabel, { color: subTextColor }]}>Beğeni</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: cardColor, borderColor }]}>
                        <Text style={[styles.statNumber, { color: '#10B981' }]}>{profileData?.stats.comment_count || 0}</Text>
                        <Text style={[styles.statLabel, { color: subTextColor }]}>Yorum</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: cardColor, borderColor }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'likes' && { backgroundColor: '#3B82F6' }]}
                        onPress={() => setActiveTab('likes')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'likes' ? '#fff' : subTextColor }]}>Beğenilerim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'comments' && { backgroundColor: '#3B82F6' }]}
                        onPress={() => setActiveTab('comments')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'comments' ? '#fff' : subTextColor }]}>Yorumlarım</Text>
                    </TouchableOpacity>
                </View>

                {/* List Content */}
                <View style={styles.listContent}>
                    {activeTab === 'likes' ? (
                        profileData?.likes.length === 0 ? (
                            <Text style={[styles.emptyText, { color: subTextColor }]}>Henüz bir haberi beğenmediniz.</Text>
                        ) : (
                            profileData?.likes.map((like) => (
                                <TouchableOpacity
                                    key={like._id}
                                    style={[styles.listItem, { backgroundColor: cardColor, borderColor }]}
                                    onPress={() => router.push({
                                        pathname: '/news-detail',
                                        params: {
                                            id: like.article_id,
                                            url: like.article_url,
                                            title: like.article_title,
                                            urlToImage: like.article_image,
                                            description: like.article_description || '',
                                            content: like.article_content || '',
                                            sourceName: like.article_source || '',
                                            publishedAt: like.article_published_at || '',
                                            category: like.article_category || '',
                                        }
                                    } as any)}
                                >
                                    <View style={styles.listItemContent}>
                                        <Text style={[styles.listItemTitle, { color: textColor }]} numberOfLines={2}>
                                            {like.article_title || 'Haber Başlığı'}
                                        </Text>
                                        <Text style={[styles.listItemDate, { color: subTextColor }]}>
                                            ❤️ {formatDate(like.created_at)}
                                        </Text>
                                    </View>
                                    {like.article_image && (
                                        <Image source={{ uri: like.article_image }} style={styles.listItemImage} />
                                    )}
                                </TouchableOpacity>
                            ))
                        )
                    ) : (
                        profileData?.comments.length === 0 ? (
                            <Text style={[styles.emptyText, { color: subTextColor }]}>Henüz bir yorum yapmadınız.</Text>
                        ) : (
                            profileData?.comments.map((comment) => (
                                <View key={comment._id} style={[styles.commentItem, { backgroundColor: cardColor, borderColor }]}>
                                    <Text style={[styles.commentText, { color: textColor }]}>"{comment.text}"</Text>
                                    <TouchableOpacity
                                        onPress={() => router.push({ pathname: '/news-detail', params: { url: comment.article_url } } as any)}
                                    >
                                        <Text style={styles.commentLink} numberOfLines={1}>Habere git →</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.commentDate, { color: subTextColor }]}>
                                        💬 {formatDate(comment.created_at)}
                                    </Text>
                                </View>
                            ))
                        )
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    backButton: { padding: 4 },
    logoutButton: { padding: 4 },
    userInfoSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#3B82F6' },
    userName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    userEmail: { fontSize: 14, marginBottom: 8 },
    joinDate: { fontSize: 12, opacity: 0.8 },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    statNumber: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '600' },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabText: { fontSize: 14, fontWeight: '700' },
    listContent: {
        paddingHorizontal: 16,
    },
    listItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    listItemContent: { flex: 1, marginRight: 12 },
    listItemTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
    listItemDate: { fontSize: 11 },
    listItemImage: { width: 60, height: 60, borderRadius: 10 },
    commentItem: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    commentText: { fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
    commentLink: { color: '#3B82F6', fontSize: 12, fontWeight: '700', marginBottom: 8 },
    commentDate: { fontSize: 11 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
