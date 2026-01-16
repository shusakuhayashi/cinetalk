import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Image } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MovieCard } from '../../components/MovieCard';
import {
    getPopularMovies,
    getNowPlayingMovies,
    getTopRatedMovies,
    getTrendingMovies,
    getUpcomingMovies,
    getMoviesByGenre,
    searchMovies,
    getImageUrl,
    GENRES,
} from '../../services/tmdb';
import { Movie } from '../../types';

interface GenreSection {
    key: string;
    title: string;
    movies: Movie[];
    loading: boolean;
}

const GENRE_ORDER = [
    'animation', 'action', 'comedy', 'romance', 'horror',
    'scifi', 'drama', 'thriller', 'fantasy', 'mystery',
    'documentary', 'family', 'music', 'crime', 'adventure',
];

export default function HomeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
    const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
    const [dailyPick, setDailyPick] = useState<Movie | null>(null);
    const [genreSections, setGenreSections] = useState<GenreSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadedGenreCount, setLoadedGenreCount] = useState(5);

    // 日付ベースで映画を選択（毎日変わる）
    const selectDailyPick = useCallback((movies: Movie[]) => {
        if (movies.length === 0) return;
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        // 評価7.5以上の映画からフィルタリング
        const highRated = movies.filter(m => m.vote_average >= 7.5);
        const pool = highRated.length > 0 ? highRated : movies;
        const index = dayOfYear % pool.length;
        setDailyPick(pool[index]);
    }, []);

    const fetchBaseData = useCallback(async () => {
        try {
            const [trending, nowPlaying, upcoming, topRated] = await Promise.all([
                getTrendingMovies(),
                getNowPlayingMovies(),
                getUpcomingMovies(),
                getTopRatedMovies(),
            ]);
            setTrendingMovies(trending.results || []);
            setNowPlayingMovies(nowPlaying.results || []);
            setUpcomingMovies(upcoming.results || []);
            setTopRatedMovies(topRated.results || []);
            // 本日のおすすめを設定
            selectDailyPick(topRated.results || []);
        } catch (err) {
            console.error('Failed to fetch base movies:', err);
        }
    }, [selectDailyPick]);

    const fetchGenreMovies = useCallback(async (genreKeys: string[]) => {
        const newSections: GenreSection[] = [];

        for (const key of genreKeys) {
            const genre = GENRES[key as keyof typeof GENRES];
            if (!genre) continue;

            try {
                const result = await getMoviesByGenre(genre.id);
                newSections.push({
                    key,
                    title: genre.name,
                    movies: result.results || [],
                    loading: false,
                });
            } catch (err) {
                console.error(`Failed to fetch ${key} movies:`, err);
            }
        }

        setGenreSections((prev) => {
            const existingKeys = prev.map(s => s.key);
            const filteredNew = newSections.filter(s => !existingKeys.includes(s.key));
            return [...prev, ...filteredNew];
        });
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchBaseData();
            await fetchGenreMovies(GENRE_ORDER.slice(0, loadedGenreCount));
            setLoading(false);
        };
        init();
    }, []);

    // 検索処理
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const result = await searchMovies(query);
            setSearchResults(result.results || []);
        } catch (err) {
            console.error('Search error:', err);
        }
    }, []);

    const loadMoreGenres = useCallback(() => {
        if (loadedGenreCount >= GENRE_ORDER.length) return;
        const nextCount = Math.min(loadedGenreCount + 3, GENRE_ORDER.length);
        const nextGenres = GENRE_ORDER.slice(loadedGenreCount, nextCount);
        setLoadedGenreCount(nextCount);
        fetchGenreMovies(nextGenres);
    }, [loadedGenreCount, fetchGenreMovies]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setGenreSections([]);
        setLoadedGenreCount(5);
        await fetchBaseData();
        await fetchGenreMovies(GENRE_ORDER.slice(0, 5));
        setRefreshing(false);
    }, [fetchBaseData, fetchGenreMovies]);

    const handleMoviePress = (movie: Movie) => {
        router.push(`/movie/${movie.id}`);
    };

    const handleScroll = (event: any) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 500;
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreGenres();
        }
    };

    const renderSection = (title: string, movies: Movie[], isFirst = false) => {
        if (movies.length === 0) return null;
        return (
            <View style={[styles.section, isFirst && styles.firstSection]} key={title}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>VIEW ALL</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={movies.slice(0, 15)}
                    renderItem={({ item }) => (
                        <MovieCard movie={item} onPress={handleMoviePress} />
                    )}
                    keyExtractor={(item) => `${title}-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.movieList}
                    ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                />
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* 検索バー */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="SEARCH MOVIES..."
                    placeholderTextColor={Colors.light.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => handleSearch('')}
                    >
                        <Text style={styles.clearButtonText}>×</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 検索結果表示 */}
            {isSearching ? (
                <ScrollView style={styles.searchResults}>
                    <Text style={styles.searchResultsTitle}>
                        RESULTS ({searchResults.length})
                    </Text>
                    <View style={styles.searchGrid}>
                        {searchResults.map((movie) => (
                            <TouchableOpacity
                                key={movie.id}
                                style={styles.searchResultItem}
                                onPress={() => handleMoviePress(movie)}
                            >
                                <MovieCard movie={movie} onPress={handleMoviePress} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    onScroll={handleScroll}
                    scrollEventThrottle={400}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.light.primary}
                        />
                    }
                >
                    {/* 本日のおすすめ */}
                    {dailyPick && (
                        <TouchableOpacity
                            style={styles.dailyPickContainer}
                            onPress={() => handleMoviePress(dailyPick)}
                        >
                            <Text style={styles.dailyPickLabel}>TODAY'S PICK</Text>
                            <View style={styles.dailyPickContent}>
                                {dailyPick.poster_path && (
                                    <Image
                                        source={{ uri: getImageUrl(dailyPick.poster_path, 'w185') || '' }}
                                        style={styles.dailyPickPoster}
                                    />
                                )}
                                <View style={styles.dailyPickInfo}>
                                    <Text style={styles.dailyPickTitle}>{dailyPick.title}</Text>
                                    <Text style={styles.dailyPickOverview} numberOfLines={4}>
                                        {dailyPick.overview}
                                    </Text>
                                    <View style={styles.dailyPickMeta}>
                                        <Text style={styles.dailyPickRating}>
                                            ★ {dailyPick.vote_average.toFixed(1)}
                                        </Text>
                                        <Text style={styles.dailyPickYear}>
                                            {dailyPick.release_date?.split('-')[0]}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}

                    {renderSection('TRENDING', trendingMovies, true)}
                    {renderSection('NOW PLAYING', nowPlayingMovies)}
                    {renderSection('COMING SOON', upcomingMovies)}
                    {renderSection('CLASSICS', topRatedMovies)}

                    {genreSections.map((section) =>
                        renderSection(section.title.toUpperCase(), section.movies)
                    )}

                    {loadedGenreCount < GENRE_ORDER.length && (
                        <View style={styles.loadingMore}>
                            <ActivityIndicator size="small" color={Colors.light.textMuted} />
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 12,
        letterSpacing: 1,
        color: Colors.light.text,
    },
    clearButton: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    clearButtonText: {
        fontSize: 18,
        color: Colors.light.textMuted,
    },
    scrollView: {
        flex: 1,
    },
    searchResults: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchResultsTitle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.textMuted,
        marginTop: 16,
        marginBottom: 16,
    },
    searchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    searchResultItem: {
        width: '30%',
    },
    firstSection: {
        marginTop: 16,
    },
    section: {
        marginTop: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
    },
    seeAllText: {
        fontSize: 11,
        letterSpacing: 1,
        color: Colors.light.textMuted,
        fontWeight: '500',
    },
    movieList: {
        paddingHorizontal: 20,
    },
    loadingMore: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    // 本日のおすすめ
    dailyPickContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 8,
        padding: 20,
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    dailyPickLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.textMuted,
        marginBottom: 16,
    },
    dailyPickContent: {
        flexDirection: 'row',
        gap: 16,
    },
    dailyPickPoster: {
        width: 80,
        height: 120,
        borderRadius: 2,
    },
    dailyPickInfo: {
        flex: 1,
    },
    dailyPickTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    dailyPickOverview: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.light.textMuted,
        marginBottom: 12,
    },
    dailyPickMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    dailyPickRating: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.star,
    },
    dailyPickYear: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
});
