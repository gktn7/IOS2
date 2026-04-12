import { useThemeColor } from '@/hooks/useThemeColor';
import { Article } from '@/services/newsService';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 3;

interface Props {
    article: Article;
    onPress: () => void;
    isGrid?: boolean;
}

function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return 'Az önce';
        if (diffHours < 24) return `${diffHours}s`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Dün';
        return `${diffDays}g`;
    } catch {
        return '';
    }
}

export default function NewsCard({ article, onPress, isGrid = true }: Props) {
    const backgroundColor = useThemeColor({}, 'card');
    const borderColor = useThemeColor({}, 'border');
    const titleColor = useThemeColor({}, 'text');
    const descriptionColor = useThemeColor({}, 'secondaryText');
    const dateColor = useThemeColor({}, 'secondaryText');
    const sourceColor = useThemeColor({}, 'secondaryText');

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

    if (isGrid) {
        return (
            <TouchableOpacity
                style={[styles.gridCard, { backgroundColor, borderColor }]}
                onPress={onPress}
                activeOpacity={0.88}
            >
                {article.urlToImage ? (
                    <Image
                        source={{ uri: article.urlToImage }}
                        style={styles.gridImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.gridImagePlaceholder, { backgroundColor: categoryColor + '33' }]}>
                        <Text style={styles.gridPlaceholderIcon}>📰</Text>
                    </View>
                )}
                <View style={styles.gridBody}>
                    <Text style={[styles.gridTitle, { color: titleColor }]} numberOfLines={2}>
                        {article.title}
                    </Text>
                    <View style={styles.gridFooter}>
                        <Text style={[styles.gridSource, { color: sourceColor }]} numberOfLines={1}>
                            {article.source?.name}
                        </Text>
                        <Text style={[styles.gridDate, { color: dateColor }]}>
                            {formatDate(article.publishedAt)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor, borderColor }]}
            onPress={onPress}
            activeOpacity={0.88}
        >
            {article.urlToImage ? (
                <Image
                    source={{ uri: article.urlToImage }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor + '33' }]}>
                    <Text style={styles.imagePlaceholderIcon}>📰</Text>
                </View>
            )}

            <View style={styles.body}>
                <View style={styles.meta}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
                        <Text style={[styles.categoryText, { color: categoryColor }]}>
                            {article.category?.toUpperCase() ?? 'HABER'}
                        </Text>
                    </View>
                    <Text style={[styles.date, { color: dateColor }]}>{formatDate(article.publishedAt)}</Text>
                </View>

                <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
                    {article.title}
                </Text>

                {article.description ? (
                    <Text style={[styles.description, { color: descriptionColor }]} numberOfLines={2}>
                        {article.description}
                    </Text>
                ) : null}

                <View style={styles.footer}>
                    <Text style={[styles.source, { color: sourceColor }]}>{article.source?.name ?? 'Belirsiz Kaynak'}</Text>
                    <Text style={styles.readMore}>Devamını Oku →</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // List View Styles
    card: {
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    image: { width: '100%', height: 180 },
    imagePlaceholder: {
        width: '100%',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderIcon: { fontSize: 40 },
    body: { padding: 16 },
    meta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    date: { fontSize: 12 },
    title: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    source: { fontSize: 12, fontWeight: '600' },
    readMore: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },

    // Grid View Styles (3 Columns)
    gridCard: {
        width: GRID_ITEM_WIDTH,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    gridImage: {
        width: '100%',
        height: GRID_ITEM_WIDTH * 0.8,
    },
    gridImagePlaceholder: {
        width: '100%',
        height: GRID_ITEM_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridPlaceholderIcon: { fontSize: 24 },
    gridBody: {
        padding: 8,
        flex: 1,
        justifyContent: 'space-between',
    },
    gridTitle: {
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 16,
        marginBottom: 4,
        height: 32, // Exactly 2 lines
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    gridSource: {
        fontSize: 9,
        fontWeight: '600',
        flex: 1,
    },
    gridDate: {
        fontSize: 9,
        marginLeft: 4,
    },
});
