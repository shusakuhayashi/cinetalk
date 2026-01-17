import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Linking,
    Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { getMovieDetails, getRecommendations, getImageUrl, getWatchProviders, getProviderUrl, WatchProvider, WatchProviderResult } from '../../services/tmdb';
import { MovieDetails, Movie } from '../../types';
import { MovieCard } from '../../components/MovieCard';
import { ReviewModal } from '../../components/ReviewModal';
import { ReviewList } from '../../components/ReviewList';
import { useMovieListStore } from '../../stores/movieListStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useChatStore } from '../../stores/chatStore';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';
import { VoiceInputModal } from '../../components/VoiceInputModal';
import { voiceRecognition } from '../../services/voiceRecognition';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [movie, setMovie] = useState<MovieDetails | null>(null);
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [watchProviders, setWatchProviders] = useState<WatchProviderResult | null>(null);

    const { isFavorite, isInWatchlist, addFavorite, removeFavorite, addToWatchlist, removeFromWatchlist } = useMovieListStore();
    const { getReviewByMovieId } = useReviewStore();

    const movieId = Number(id);
    const favorite = isFavorite(movieId);
    const inWatchlist = isInWatchlist(movieId);
    const existingReview = getReviewByMovieId(movieId);

    useEffect(() => {
        if (id) {
            fetchMovieData(movieId);
        }
    }, [id]);

    const fetchMovieData = async (movieId: number) => {
        try {
            const [details, recs, providers] = await Promise.all([
                getMovieDetails(movieId),
                getRecommendations(movieId),
                getWatchProviders(movieId),
            ]);
            setMovie(details);
            setRecommendations(recs.results || []);
            setWatchProviders(providers);
        } catch (error) {
            console.error('Failed to fetch movie:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = () => {
        if (!movie) return;
        if (favorite) {
            removeFavorite(movieId);
        } else {
            addFavorite({
                movie_id: movieId,
                movie_title: movie.title,
                movie_poster: movie.poster_path,
            });
        }
    };

    const handleWatchlistToggle = () => {
        if (!movie) return;
        if (inWatchlist) {
            removeFromWatchlist(movieId);
        } else {
            addToWatchlist({
                movie_id: movieId,
                movie_title: movie.title,
                movie_poster: movie.poster_path,
            });
        }
    };

    const handleWatchNow = () => {
        const searchQuery = encodeURIComponent(movie?.title || '');
        Linking.openURL(`https://video.unext.jp/search?query=${searchQuery}`);
    };

    const { setSelectedMovie, clearChat } = useChatStore();

    const handleStartChat = () => {
        if (!movie) return;

        const directors = movie.credits?.crew
            ?.filter((c) => c.job === 'Director')
            .map((c) => c.name) || [];

        const castNames = movie.credits?.cast
            ?.slice(0, 5)
            .map((c) => c.name) || [];

        clearChat();
        setSelectedMovie({
            id: movie.id,
            title: movie.title,
            originalTitle: movie.original_title,
            posterPath: movie.poster_path,
            genres: movie.genres.map((g) => g.name),
            directors,
            cast: castNames,
            overview: movie.overview || '',
            releaseDate: movie.release_date,
            voteAverage: movie.vote_average,
        });

        router.push('/(tabs)/chat');
    };

    // 音声入力で感想を始める
    const handleTalkAboutMovie = () => {
        if (!movie) return;

        // 音声入力がサポートされているかチェック
        if (!voiceRecognition.isSupported()) {
            Alert.alert(
                '音声入力非対応',
                'このブラウザ/デバイスでは音声入力がサポートされていません\nチャット画面でテキスト入力で感想を書けます',
                [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: 'チャットへ', onPress: handleStartChat },
                ]
            );
            return;
        }

        setShowVoiceModal(true);
    };

    const handleRecommendationPress = (rec: Movie) => {
        router.push(`/movie/${rec.id}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.accent} />
            </View>
        );
    }

    if (!movie) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>映画が見つかりませんでした</Text>
            </View>
        );
    }

    const backdropUrl = getImageUrl(movie.backdrop_path, 'w780');
    const posterUrl = getImageUrl(movie.poster_path, 'w342');
    const director = movie.credits?.crew?.find((c) => c.job === 'Director');
    const cast = movie.credits?.cast?.slice(0, 10) || [];

    return (
        <View style={styles.screenContainer}>
            {/* 固定ヘッダー */}
            <StaticHeader title="シネマ管理くん〜 話、聞こか？ 〜" showBackButton />

            <ScrollView
                style={styles.container}
                bounces={false}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
            >
                {/* バックドロップ画像 */}
                <View style={styles.backdropContainer}>
                    {backdropUrl ? (
                        <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
                    ) : (
                        <View style={[styles.backdrop, styles.backdropPlaceholder]} />
                    )}
                    <View style={styles.backdropOverlay} />
                </View>

                {/* メイン情報 */}
                <View style={styles.mainInfo}>
                    <View style={styles.posterContainer}>
                        {posterUrl ? (
                            <Image source={{ uri: posterUrl }} style={styles.poster} />
                        ) : (
                            <View style={[styles.poster, styles.posterPlaceholder]}>
                                <Text style={styles.posterPlaceholderText}>MOVIE</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{movie.title}</Text>
                        {movie.original_title !== movie.title && (
                            <Text style={styles.originalTitle}>{movie.original_title}</Text>
                        )}
                        <View style={styles.metaRow}>
                            <Text style={styles.metaText}>
                                {movie.release_date?.split('-')[0]} • {movie.runtime}分
                            </Text>
                        </View>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingText}>★ {movie.vote_average.toFixed(1)}</Text>
                            <Text style={styles.voteCount}>({movie.vote_count} reviews)</Text>
                        </View>
                    </View>
                </View>

                {/* 自分のレビュー表示 */}
                {existingReview && (
                    <View style={styles.myReviewContainer}>
                        <Text style={styles.myReviewTitle}>あなたのレビュー</Text>
                        <View style={styles.myReviewRating}>
                            <Text style={styles.myReviewStars}>
                                {'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}
                            </Text>
                        </View>
                        {existingReview.tags.length > 0 && (
                            <View style={styles.myReviewTags}>
                                {existingReview.tags.map((tag) => (
                                    <View key={tag} style={styles.myReviewTag}>
                                        <Text style={styles.myReviewTagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {existingReview.content && (
                            <Text style={styles.myReviewContent}>{existingReview.content}</Text>
                        )}
                    </View>
                )}

                {/* アクションボタン（小型アイコン） */}
                <View style={styles.smallActionButtons}>
                    <TouchableOpacity
                        style={[styles.smallActionButton, favorite && styles.smallActionButtonActive]}
                        onPress={handleFavoriteToggle}
                    >
                        <Text style={[styles.smallActionIcon, favorite && styles.smallActionIconActive]}>
                            {favorite ? '♥' : '♡'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.smallActionButton, inWatchlist && styles.smallActionButtonActive]}
                        onPress={handleWatchlistToggle}
                    >
                        <View style={styles.tvIcon}>
                            <View style={[styles.tvScreen, inWatchlist && styles.tvScreenActive]} />
                            <View style={[styles.tvStand, inWatchlist && styles.tvStandActive]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* メインCTA: この映画について話す */}
                <TouchableOpacity style={styles.talkButton} onPress={handleTalkAboutMovie}>
                    <Text style={styles.talkButtonIcon}>MIC</Text>
                    <View style={styles.talkButtonContent}>
                        <Text style={styles.talkButtonTitle}>この映画について話す</Text>
                        <Text style={styles.talkButtonSubtitle}>AIがあなたの感想をレビューにまとめます</Text>
                    </View>
                </TouchableOpacity>

                {/* 配信サービス */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
                    <View style={styles.providersSection}>
                        <Text style={styles.providersSectionTitle}>この映画を見る</Text>

                        {/* 定額見放題 */}
                        {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                            <View style={styles.providerCategory}>
                                <Text style={styles.providerCategoryLabel}>見放題</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerList}>
                                    {watchProviders.flatrate.map((provider) => (
                                        <TouchableOpacity
                                            key={provider.provider_id}
                                            style={styles.providerItem}
                                            onPress={() => Linking.openURL(getProviderUrl(provider.provider_id, movie.title, watchProviders?.link))}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(provider.logo_path, 'w185')! }}
                                                style={styles.providerLogo}
                                            />
                                            <Text style={styles.providerName} numberOfLines={1}>
                                                {provider.provider_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* レンタル */}
                        {watchProviders.rent && watchProviders.rent.length > 0 && (
                            <View style={styles.providerCategory}>
                                <Text style={styles.providerCategoryLabel}>レンタル</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerList}>
                                    {watchProviders.rent.map((provider) => (
                                        <TouchableOpacity
                                            key={provider.provider_id}
                                            style={styles.providerItem}
                                            onPress={() => Linking.openURL(getProviderUrl(provider.provider_id, movie.title, watchProviders?.link))}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(provider.logo_path, 'w185')! }}
                                                style={styles.providerLogo}
                                            />
                                            <Text style={styles.providerName} numberOfLines={1}>
                                                {provider.provider_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* 購入 */}
                        {watchProviders.buy && watchProviders.buy.length > 0 && (
                            <View style={styles.providerCategory}>
                                <Text style={styles.providerCategoryLabel}>購入</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerList}>
                                    {watchProviders.buy.map((provider) => (
                                        <TouchableOpacity
                                            key={provider.provider_id}
                                            style={styles.providerItem}
                                            onPress={() => Linking.openURL(getProviderUrl(provider.provider_id, movie.title, watchProviders?.link))}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(provider.logo_path, 'w185')! }}
                                                style={styles.providerLogo}
                                            />
                                            <Text style={styles.providerName} numberOfLines={1}>
                                                {provider.provider_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                {/* ジャンル */}
                <View style={styles.section}>
                    <View style={styles.genreContainer}>
                        {movie.genres.map((genre) => (
                            <View key={genre.id} style={styles.genreBadge}>
                                <Text style={styles.genreText}>{genre.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* あらすじ */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>あらすじ</Text>
                    <Text style={styles.overview}>
                        {movie.overview || 'あらすじ情報がありません'}
                    </Text>
                </View>

                {/* 監督 */}
                {director && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>監督</Text>
                        <TouchableOpacity
                            onPress={() => router.push(`/person/${director.id}`)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.directorName}>{director.name} ›</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* キャスト */}
                {cast.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>キャスト</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {cast.map((person) => (
                                <TouchableOpacity
                                    key={person.id}
                                    style={styles.castItem}
                                    onPress={() => router.push(`/person/${person.id}`)}
                                    activeOpacity={0.7}
                                >
                                    {person.profile_path ? (
                                        <Image
                                            source={{ uri: getImageUrl(person.profile_path, 'w185')! }}
                                            style={styles.castImage}
                                        />
                                    ) : (
                                        <View style={[styles.castImage, styles.castPlaceholder]}>
                                            <Text style={styles.castPlaceholderText}>-</Text>
                                        </View>
                                    )}
                                    <Text style={styles.castName} numberOfLines={1}>
                                        {person.name}
                                    </Text>
                                    <Text style={styles.castCharacter} numberOfLines={1}>
                                        {person.character}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* みんなのレビュー（TMDb） */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>REVIEWS</Text>
                    <ReviewList movieId={movieId} />
                </View>

                {/* おすすめ映画 */}
                {recommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>おすすめ映画</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {recommendations.slice(0, 10).map((rec) => (
                                <View key={rec.id} style={styles.recommendationItem}>
                                    <MovieCard movie={rec} onPress={handleRecommendationPress} />
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* 音声入力モーダル */}
            {movie && (
                <VoiceInputModal
                    visible={showVoiceModal}
                    onClose={() => setShowVoiceModal(false)}
                    movie={{
                        id: movie.id,
                        title: movie.title,
                        poster_path: movie.poster_path,
                        backdrop_path: movie.backdrop_path,
                        release_date: movie.release_date,
                        vote_average: movie.vote_average,
                        vote_count: movie.vote_count,
                        overview: movie.overview,
                    } as Movie}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    errorText: {
        color: Colors.light.textMuted,
        fontSize: 16,
    },
    backdropContainer: {
        height: 250,
        position: 'relative',
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    backdropPlaceholder: {
        backgroundColor: Colors.light.primary,
    },
    backdropOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    mainInfo: {
        flexDirection: 'row',
        padding: 20,
        marginTop: -60,
    },
    posterContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 12,
    },
    posterPlaceholder: {
        backgroundColor: Colors.light.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterPlaceholderText: {
        fontSize: 40,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 16,
        paddingTop: 70,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    originalTitle: {
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    metaRow: {
        marginBottom: 8,
    },
    metaText: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFD700',
    },
    voteCount: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginLeft: 6,
    },
    myReviewContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.accent,
    },
    myReviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.accent,
        marginBottom: 8,
    },
    myReviewRating: {
        marginBottom: 8,
    },
    myReviewStars: {
        fontSize: 20,
        color: '#FFD700',
    },
    myReviewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    myReviewTag: {
        backgroundColor: Colors.light.accent + '20',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    myReviewTagText: {
        fontSize: 12,
        color: Colors.light.accent,
    },
    myReviewContent: {
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        backgroundColor: Colors.light.surface,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    actionButtonActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    actionButtonIcon: {
        fontSize: 18,
        color: Colors.light.primary,
        marginBottom: 4,
    },
    actionButtonIconActive: {
        color: '#FFFFFF',
    },
    actionButtonText: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    actionButtonTextActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    // テレビアイコン
    tvIcon: {
        alignItems: 'center',
        height: 18,
        justifyContent: 'center',
        marginBottom: 4,
    },
    tvScreen: {
        width: 18,
        height: 11,
        borderWidth: 1.5,
        borderColor: Colors.light.primary,
        borderRadius: 2,
    },
    tvScreenActive: {
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tvStand: {
        width: 10,
        height: 2,
        backgroundColor: Colors.light.primary,
        marginTop: 1,
        borderRadius: 1,
    },
    tvStandActive: {
        backgroundColor: '#FFFFFF',
    },
    // 小型アイコンボタン（お気に入り・あとで見る）
    smallActionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 12,
    },
    smallActionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    smallActionButtonActive: {
        backgroundColor: Colors.light.primary,
        borderColor: Colors.light.primary,
    },
    smallActionIcon: {
        fontSize: 20,
        color: Colors.light.primary,
    },
    smallActionIconActive: {
        color: '#FFFFFF',
    },
    // メインCTA: この映画について話す
    talkButton: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 2,
        borderColor: Colors.light.accent,
    },
    talkButtonIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    talkButtonContent: {
        flex: 1,
    },
    talkButtonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 2,
    },
    talkButtonSubtitle: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    watchButton: {
        marginHorizontal: 20,
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 12,
    },
    watchButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
    },
    chatButton: {
        marginHorizontal: 20,
        backgroundColor: Colors.light.surface,
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.light.primary,
    },
    chatButtonText: {
        color: Colors.light.primary,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 12,
    },
    genreContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    genreBadge: {
        backgroundColor: Colors.light.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    genreText: {
        fontSize: 13,
        color: Colors.light.text,
    },
    overview: {
        fontSize: 15,
        lineHeight: 24,
        color: Colors.light.text,
    },
    directorName: {
        fontSize: 16,
        color: Colors.light.text,
    },
    castItem: {
        width: 80,
        marginRight: 16,
        alignItems: 'center',
    },
    castImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
    },
    castPlaceholder: {
        backgroundColor: Colors.light.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    castPlaceholderText: {
        fontSize: 24,
    },
    castName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
        textAlign: 'center',
    },
    castCharacter: {
        fontSize: 11,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
    recommendationItem: {
        marginRight: 16,
        width: 140,
    },
    bottomSpacer: {
        height: 40,
    },
    // 配信サービスセクション
    providersSection: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 16,
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    providersSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 12,
    },
    providerCategory: {
        marginBottom: 12,
    },
    providerCategoryLabel: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    providerList: {
        flexDirection: 'row',
    },
    providerItem: {
        alignItems: 'center',
        marginRight: 16,
        width: 60,
    },
    providerLogo: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginBottom: 4,
    },
    providerName: {
        fontSize: 10,
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
});
