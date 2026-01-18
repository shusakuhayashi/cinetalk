import { View, Text, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, TextInput, Image, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';
import { useEffect, useState, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MovieCard } from '../../components/MovieCard';
import { MoodSection } from '../../components/MoodSection';
import { BirthdaySection } from '../../components/BirthdaySection';
import { Best5Section } from '../../components/Best5Section';
import {
    getPopularMovies,
    getNowPlayingMovies,
    getTopRatedMovies,
    getTrendingMovies,
    getUpcomingMovies,
    getMoviesByGenre,
    getMoviesByMood,
    getPersonCredits,
    getDirectorBest5,
    getEraCountryBest5,
    getHiddenGemBest5,
    getWorldCinemaBest5,
    getJapaneseMovieBest5,
    searchMovies,
    getImageUrl,
    GENRES,
} from '../../services/tmdb';
import { Movie } from '../../types';
import { MOOD_CATEGORIES, MoodCategory, getDailyMoodSeed } from '../../data/moodCategories';
import { getTodayBirthdayPeople, BirthdayPerson } from '../../data/birthdayPeople';
import {
    getDailyDirector,
    getDailyEraCountry,
    getDailyHiddenGemGenre,
    getDailyJapaneseMovieGenre,
    getDailyWorldCinemaCountry,
    DirectorData,
    EraCountryData,
    HiddenGemGenre,
    JapaneseMovieGenre,
    WorldCinemaCountry,
} from '../../data/best3Categories';

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
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Movie[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
    const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
    const [genreSections, setGenreSections] = useState<GenreSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadedGenreCount, setLoadedGenreCount] = useState(5);

    // スティッキー検索バー用の状態
    const [isSearchBarSticky, setIsSearchBarSticky] = useState(false);
    const searchBarOriginalY = useRef<number>(0);

    // 新機能用ステート
    const [moodMovies, setMoodMovies] = useState<{ mood: MoodCategory; movie: Movie | null }[]>([]);
    const [birthdayPeople, setBirthdayPeople] = useState<{ person: BirthdayPerson; movies: Movie[] }[]>([]);

    // Best5ランキング用ステート
    const [dailyDirector, setDailyDirector] = useState<DirectorData | null>(null);
    const [directorMovies, setDirectorMovies] = useState<Movie[]>([]);
    const [dailyEraCountry, setDailyEraCountry] = useState<EraCountryData | null>(null);
    const [eraCountryMovies, setEraCountryMovies] = useState<Movie[]>([]);
    const [dailyHiddenGemGenre, setDailyHiddenGemGenre] = useState<HiddenGemGenre | null>(null);
    const [hiddenGemMovies, setHiddenGemMovies] = useState<Movie[]>([]);
    const [dailyWorldCinemaCountry, setDailyWorldCinemaCountry] = useState<WorldCinemaCountry | null>(null);
    const [worldCinemaMovies, setWorldCinemaMovies] = useState<Movie[]>([]);
    const [dailyJapaneseMovieGenre, setDailyJapaneseMovieGenre] = useState<JapaneseMovieGenre | null>(null);
    const [japaneseMovies, setJapaneseMovies] = useState<Movie[]>([]);

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
        } catch (err) {
            console.error('Failed to fetch base movies:', err);
        }
    }, []);

    // 新機能: 気分別映画を取得
    const fetchMoodMovies = useCallback(async () => {
        try {
            const moodResults = await Promise.all(
                MOOD_CATEGORIES.map(async (mood) => {
                    const seed = getDailyMoodSeed(mood.id);
                    const movie = await getMoviesByMood(
                        mood.genreIds,
                        mood.excludeGenreIds || [],
                        mood.minRating || 6.5,
                        seed
                    );
                    return { mood, movie };
                })
            );
            setMoodMovies(moodResults);
        } catch (err) {
            console.error('Failed to fetch mood movies:', err);
        }
    }, []);

    // 新機能: 今日誕生日の映画人を取得
    const fetchBirthdayPeople = useCallback(async () => {
        try {
            const todayPeople = getTodayBirthdayPeople();
            const peopleWithMovies = await Promise.all(
                todayPeople.slice(0, 3).map(async (person) => {
                    const movies = await getPersonCredits(person.id);
                    return { person, movies };
                })
            );
            setBirthdayPeople(peopleWithMovies);
        } catch (err) {
            console.error('Failed to fetch birthday people:', err);
        }
    }, []);


    // Best5ランキングデータを取得
    const fetchBest5Data = useCallback(async () => {
        try {
            // 1. 今日の監督を取得
            const director = getDailyDirector();
            setDailyDirector(director);
            const dirMovies = await getDirectorBest5(director.id);
            setDirectorMovies(dirMovies);

            // 2. 今日の年代×国を取得
            const eraCountry = getDailyEraCountry();
            setDailyEraCountry(eraCountry);
            const eraMovies = await getEraCountryBest5(eraCountry.countryCode, eraCountry.decade);
            setEraCountryMovies(eraMovies);

            // 3. 今日の隠れた名作ジャンルを取得
            const hiddenGenre = getDailyHiddenGemGenre();
            setDailyHiddenGemGenre(hiddenGenre);
            const hiddenMovies = await getHiddenGemBest5(hiddenGenre.genreId);
            setHiddenGemMovies(hiddenMovies);

            // 4. 世界の映画を取得
            const worldCountry = getDailyWorldCinemaCountry();
            setDailyWorldCinemaCountry(worldCountry);
            const worldMovies = await getWorldCinemaBest5(worldCountry.countryCode);
            setWorldCinemaMovies(worldMovies);

            // 5. 日本映画を取得
            const japaneseGenre = getDailyJapaneseMovieGenre();
            setDailyJapaneseMovieGenre(japaneseGenre);
            const jpMovies = await getJapaneseMovieBest5(japaneseGenre.genreId);
            setJapaneseMovies(jpMovies);
        } catch (err) {
            console.error('Failed to fetch best5 data:', err);
        }
    }, []);

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
            // 基本データと新機能データを並列で取得
            await Promise.all([
                fetchBaseData(),
                fetchMoodMovies(),
                fetchBirthdayPeople(),
                fetchBest5Data(),
            ]);
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
        await Promise.all([
            fetchBaseData(),
            fetchMoodMovies(),
            fetchBirthdayPeople(),
            fetchBest5Data(),
        ]);
        await fetchGenreMovies(GENRE_ORDER.slice(0, 5));
        setRefreshing(false);
    }, [fetchBaseData, fetchMoodMovies, fetchBirthdayPeople, fetchBest5Data, fetchGenreMovies]);

    const handleMoviePress = (movie: Movie) => {
        router.push(`/movie/${movie.id}`);
    };

    const handlePersonPress = (personId: number) => {
        router.push(`/person/${personId}`);
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 500;

        // 無限スクロール
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreGenres();
        }

        // スティッキー検索バーの判定
        // 検索バーの元の位置がヘッダーの下に到達したらスティッキーにする
        const stickyThreshold = searchBarOriginalY.current - HEADER_HEIGHT - insets.top;
        if (contentOffset.y >= stickyThreshold && searchBarOriginalY.current > 0) {
            if (!isSearchBarSticky) setIsSearchBarSticky(true);
        } else {
            if (isSearchBarSticky) setIsSearchBarSticky(false);
        }
    };

    const handleSearchBarLayout = (event: LayoutChangeEvent) => {
        if (searchBarOriginalY.current === 0) {
            // contentContainerStyle の paddingTop を考慮した絶対位置
            searchBarOriginalY.current = event.nativeEvent.layout.y;
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
            {/* 固定ヘッダー */}
            <StaticHeader title="シネマ管理くん〜 話、聞こか？ 〜" />

            {/* スティッキー検索バーオーバーレイ（スクロールで固定表示） */}
            {isSearchBarSticky && !isSearching && (
                <View style={[styles.stickySearchOverlay, { top: HEADER_HEIGHT + insets.top }]}>
                    <Text style={styles.searchSectionTitle}>SEARCH MOVIES</Text>
                    <View style={styles.searchBarInner}>
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
                </View>
            )}

            {/* 検索結果表示 */}
            {isSearching ? (
                <ScrollView style={[styles.searchResults, { marginTop: HEADER_HEIGHT + insets.top + 16 }]}>
                    <View style={styles.searchBarInner}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="SEARCH MOVIES..."
                            placeholderTextColor={Colors.light.textMuted}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            returnKeyType="search"
                            autoFocus
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
                    contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.light.primary}
                        />
                    }
                >
                    {/* ===== TODAY'S セクション ===== */}
                    <View style={styles.todaysSection}>
                        {/* TODAY'S Picks バナー画像 */}
                        <Image
                            source={require('../../assets/todays-picks-banner.jpg')}
                            style={styles.todaysBanner}
                            resizeMode="stretch"
                        />

                        {/* Mood Picks */}
                        <MoodSection
                            moodMovies={moodMovies}
                            onMoviePress={handleMoviePress}
                        />

                        {/* Happy Birthday */}
                        <BirthdaySection
                            birthdayPeople={birthdayPeople}
                            onPersonPress={handlePersonPress}
                            onMoviePress={handleMoviePress}
                        />

                        {/* BEST5ランキング */}
                        <Best5Section
                            director={dailyDirector}
                            directorMovies={directorMovies}
                            eraCountry={dailyEraCountry}
                            eraCountryMovies={eraCountryMovies}
                            hiddenGemGenre={dailyHiddenGemGenre}
                            hiddenGemMovies={hiddenGemMovies}
                            worldCinemaCountry={dailyWorldCinemaCountry}
                            worldCinemaMovies={worldCinemaMovies}
                            japaneseMovieGenre={dailyJapaneseMovieGenre}
                            japaneseMovies={japaneseMovies}
                            onMoviePress={handleMoviePress}
                        />
                    </View>

                    {/* セクション区切り線 */}
                    <View style={styles.sectionDivider} />

                    {/* 検索バー */}
                    <View
                        style={styles.inlineSearchWrapper}
                        onLayout={handleSearchBarLayout}
                    >
                        {/* スティッキーモード時は透明のプレースホルダーのみ表示 */}
                        {isSearchBarSticky ? (
                            <View style={styles.searchPlaceholder} />
                        ) : (
                            <>
                                <Text style={styles.searchSectionTitle}>SEARCH MOVIES</Text>
                                <View style={styles.searchBarInner}>
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
                            </>
                        )}
                    </View>

                    {/* ===== 既存セクション ===== */}
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
    // スティッキー検索バーオーバーレイ（position: fixed）
    stickySearchOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: Colors.light.background,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    // インライン検索バー（通常の配置）
    inlineSearchWrapper: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        marginBottom: 8,
    },
    searchBarInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    searchSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        marginBottom: 12,
    },
    searchPlaceholder: {
        height: 60, // SEARCH MOVIES title + input height
    },
    // TODAY'Sセクション
    todaysSection: {
        // paddingなし
    },
    todaysBanner: {
        width: '100%',
        height: 'auto',
        aspectRatio: 1024 / 512, // 元画像の実際のアスペクト比
        marginTop: 0,
        marginBottom: 0,
    },
    // セクション区切り線
    sectionDivider: {
        height: 1,
        backgroundColor: Colors.light.border,
        marginHorizontal: 20,
        marginVertical: 24,
    },
});
