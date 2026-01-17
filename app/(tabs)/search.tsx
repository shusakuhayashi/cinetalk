import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MovieCard } from '../../components/MovieCard';
import { searchMovies } from '../../services/tmdb';
import { Movie } from '../../types';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const response = await searchMovies(query);
            setResults(response.results || []);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleMoviePress = (movie: Movie) => {
        router.push(`/movie/${movie.id}`);
    };

    const renderItem = useCallback(
        ({ item, index }: { item: Movie; index: number }) => (
            <View style={[styles.cardWrapper, index % 2 === 1 && styles.cardRight]}>
                <MovieCard movie={item} onPress={handleMoviePress} />
            </View>
        ),
        []
    );

    return (
        <View style={styles.container}>
            {/* 検索バー */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="映画タイトルで検索..."
                    placeholderTextColor={Colors.light.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={[styles.searchButton, !query.trim() && styles.searchButtonDisabled]}
                    onPress={handleSearch}
                    disabled={!query.trim()}
                >
                    <Text style={styles.searchButtonText}>検索</Text>
                </TouchableOpacity>
            </View>

            {/* 検索結果 */}
            <View style={styles.resultsContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.light.accent} />
                        <Text style={styles.loadingText}>検索中...</Text>
                    </View>
                ) : searched && results.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>?</Text>
                        <Text style={styles.emptyText}>
                            「{query}」の検索結果はありません
                        </Text>
                    </View>
                ) : results.length > 0 ? (
                    <FlatList
                        data={results}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.row}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintEmoji}>SEARCH</Text>
                        <Text style={styles.hintText}>
                            映画タイトルを入力して検索してください
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: Colors.light.surface,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    searchInput: {
        flex: 1,
        backgroundColor: Colors.light.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    searchButton: {
        backgroundColor: Colors.light.accent,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 12,
    },
    searchButtonDisabled: {
        backgroundColor: Colors.light.textMuted,
        opacity: 0.5,
    },
    searchButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    resultsContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: Colors.light.textMuted,
        fontSize: 14,
    },
    listContent: {
        padding: 20,
    },
    row: {
        justifyContent: 'space-between',
    },
    cardWrapper: {
        width: '48%',
    },
    cardRight: {
        marginLeft: '4%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
    hintContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    hintEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    hintText: {
        fontSize: 16,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
});
