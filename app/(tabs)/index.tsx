import NewsCard from '@/components/NewsCard';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Article, newsService } from '@/services/newsService';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CATEGORIES = ['tümü', 'teknoloji', 'spor', 'ekonomi', 'dünya', 'bilim', 'kültür'];

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const subTextColor = useThemeColor({}, 'secondaryText');
  const borderColor = useThemeColor({}, 'border');
  const inputColor = useThemeColor({}, 'input');

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchText, setSearchText] = useState('');

  const fetchNews = useCallback(async (category: string, q: string) => {
    try {
      const data = await newsService.getNews(category === 'tümü' ? '' : category, q);
      setArticles(data.articles);
    } catch (error) {
      Alert.alert('Hata', 'Haberler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNews(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, fetchNews]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews(selectedCategory, searchQuery);
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  const renderHeader = () => (
    <View style={{ backgroundColor }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: textColor }]}>Merhaba, {user?.name?.split(' ')[0] ?? 'Kullanıcı'} 👋</Text>
          <Text style={[styles.subGreeting, { color: subTextColor }]}>Güncel haberleri keşfet</Text>
        </View>
        <TouchableOpacity style={[styles.themeBtn, { backgroundColor: cardColor, borderColor }]} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{theme === 'light' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: inputColor, borderColor, color: textColor }]}
          placeholder="Haber ara..."
          placeholderTextColor={subTextColor}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Kategoriler */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => {
          const isActive = item === selectedCategory;
          return (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { backgroundColor: cardColor, borderColor },
                isActive && styles.categoryChipActive
              ]}
              onPress={() => {
                setSelectedCategory(item);
                setSearchQuery('');
                setSearchText('');
              }}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.categoryChipText,
                { color: subTextColor },
                isActive && styles.categoryChipTextActive
              ]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={[styles.sectionTitle, { color: textColor }]}>
        {searchQuery ? `"${searchQuery}" sonuçları` : selectedCategory === 'tümü' ? 'Son Haberler' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
        <Text style={styles.sectionCount}> ({articles.length})</Text>
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Haberler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NewsCard
            article={item}
            onPress={() => {
              Alert.alert(item.title, item.description || item.content || 'İçerik mevcut değil.');
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyText, { color: textColor }]}>Haber bulunamadı</Text>
            <Text style={[styles.emptySubText, { color: subTextColor }]}>Farklı bir kategori veya arama terimi deneyin</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  listContent: { paddingBottom: 24 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 20, fontWeight: '800' },
  subGreeting: { fontSize: 13, marginTop: 2 },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  themeIcon: { fontSize: 18 },

  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  searchBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: { fontSize: 18 },

  categoriesContainer: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionCount: { fontWeight: '400' },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubText: { fontSize: 14, textAlign: 'center' },
});
