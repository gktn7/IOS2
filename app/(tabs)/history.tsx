import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { HistoryArticle, historyService } from '@/services/historyService';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

function formatViewedDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / (1000 * 60));
        if (diffMin < 1) return 'Az önce';
        if (diffMin < 60) return `${diffMin} dk önce`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours < 24) return `${diffHours} saat önce`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
        });
    } catch {
        return dateStr;
    }
}

export default function HistoryScreen() {
    const { user } = useAuth();
    const { theme } = useTheme();

    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');
    const subTextColor = useThemeColor({}, 'secondaryText');
    const borderColor = useThemeColor({}, 'border');
    const tintColor = useThemeColor({}, 'tint');

    const [historyItems, setHistoryItems] = useState<HistoryArticle[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await historyService.getHistory(user.id);
            setHistoryItems(data.history);
        } catch {
            setHistoryItems([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // Sayfa her odaklandığında yenile
    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [fetchHistory])
    );

    const handleClearHistory = () => {
        Alert.alert(
            'Geçmişi Temizle',
            'Tüm görüntüleme geçmişiniz silinecek. Devam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Temizle',
                    style: 'destructive',
                    onPress: async () => {
                        if (!user?.id) return;
                        try {
                            await historyService.clearHistory(user.id);
                            setHistoryItems([]);
                        } catch {
                            Alert.alert('Hata', 'Geçmiş temizlenirken bir sorun oluştu.');
                        }
                    },
                },
            ]
        );
    };

    const handleItemPress = (item: HistoryArticle) => {
        router.push({
            pathname: '/news-detail' as any,
            params: {
                id: item.id,
                title: item.title,
                description: item.description || '',
                content: item.content || '',
                url: item.url || '',
                urlToImage: item.urlToImage || '',
                publishedAt: item.publishedAt || '',
                sourceName: item.source?.name || '',
                category: item.category || '',
            },
        });
    };

    const renderItem = ({ item }: { item: HistoryArticle }) => (
        <TouchableOpacity
            style={[styles.historyCard, { backgroundColor: cardColor, borderColor }]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.85}
        >
            {item.urlToImage ? (
                <Image
                    source={{ uri: item.urlToImage }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.cardImagePlaceholder, { backgroundColor: tintColor + '22' }]}>
                    <Text style={{ fontSize: 28 }}>📰</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
                    {item.title}
                </Text>
                <View style={styles.cardMeta}>
                    <Text style={[styles.cardSource, { color: subTextColor }]} numberOfLines={1}>
                        {item.source?.name ?? 'Bilinmiyor'}
                    </Text>
                    <View style={styles.cardDateRow}>
                        <Ionicons name="time-outline" size={12} color={subTextColor} />
                        <Text style={[styles.cardDate, { color: subTextColor }]}>
                            {item.viewed_at ? formatViewedDate(item.viewed_at) : ''}
                        </Text>
                    </View>
                </View>
            </View>
            <Ionicons
                name="chevron-forward"
                size={18}
                color={subTextColor}
                style={styles.cardArrow}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: textColor }]}>📜 Geçmiş</Text>
                    <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
                        Daha önce görüntülediğiniz haberler
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={tintColor} />
                    <Text style={[styles.loadingText, { color: subTextColor }]}>Yükleniyor...</Text>
                </View>
            ) : (
                <FlatList
                    data={historyItems}
                    keyExtractor={(item, index) => `${item.id}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🕐</Text>
                            <Text style={[styles.emptyTitle, { color: textColor }]}>
                                Geçmiş boş
                            </Text>
                            <Text style={[styles.emptySubtext, { color: subTextColor }]}>
                                Haber okumaya başladığınızda{'\n'}geçmişiniz burada görünecek
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    clearBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    clearBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardImage: {
        width: 90,
        height: 80,
    },
    cardImagePlaceholder: {
        width: 90,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardBody: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 6,
    },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardSource: {
        fontSize: 11,
        fontWeight: '500',
        flex: 1,
    },
    cardDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    cardDate: {
        fontSize: 10,
    },
    cardArrow: {
        marginRight: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 56,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
});
