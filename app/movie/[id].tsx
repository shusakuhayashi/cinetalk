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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Colors } from '../../constants/Colors';
import { getMovieDetails, getRecommendations, getImageUrl } from '../../services/tmdb';
import { MovieDetails, Movie } from '../../types';
import { MovieCard } from '../../components/MovieCard';
import { ReviewModal } from '../../components/ReviewModal';
import { ReviewList } from '../../components/ReviewList';
import { useMovieListStore } from '../../stores/movieListStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useChatStore } from '../../stores/chatStore';

const { width } = Dimensions.get('window');

export default function MovieDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [movie, setMovie] = useState<MovieDetails | null>(null);
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);

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
            const [details, recs] = await Promise.all([
                getMovieDetails(movieId),
                getRecommendations(movieId),
            ]);
            setMovie(details);
            setRecommendations(recs.results || []);
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
        <>
            <ScrollView style={styles.container} bounces={false}>
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
                                <Text style={styles.posterPlaceholderText}>🎬</Text>
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

                {/* アクションボタン */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, favorite && styles.actionButtonActive]}
                        onPress={handleFavoriteToggle}
                    >
                        <Text style={[styles.actionButtonIcon, favorite && styles.actionButtonIconActive]}>
                            {favorite ? '♥' : '♡'}
                        </Text>
                        <Text style={[styles.actionButtonText, favorite && styles.actionButtonTextActive]}>
                            お気に入り
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, inWatchlist && styles.actionButtonActive]}
                        onPress={handleWatchlistToggle}
                    >
                        <View style={styles.tvIcon}>
                            <View style={[styles.tvScreen, inWatchlist && styles.tvScreenActive]} />
                            <View style={[styles.tvStand, inWatchlist && styles.tvStandActive]} />
                        </View>
                        <Text style={[styles.actionButtonText, inWatchlist && styles.actionButtonTextActive]}>
                            あとで見る
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, existingReview && styles.actionButtonActive]}
                        onPress={handleStartChat}
                    >
                        <Text style={[styles.actionButtonIcon, existingReview && styles.actionButtonIconActive]}>
                            ✎
                        </Text>
                        <Text style={[styles.actionButtonText, existingReview && styles.actionButtonTextActive]}>
                            {existingReview ? '編集' : 'レビュー'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 視聴リンク */}
                <TouchableOpacity style={styles.watchButton} onPress={handleWatchNow}>
                    <Text style={styles.watchButtonText}>今すぐ視聴する</Text>
                </TouchableOpacity>

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
                                            <Text style={styles.castPlaceholderText}>👤</Text>
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
                    <Text style={styles.sectionTitle}>📝 みんなのレビュー</Text>
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
            </ScrollView >

            {/* レビューモーダル */}
            < ReviewModal
                visible={showReviewModal}
                onClose={() => setShowReviewModal(false)
                }
                movieId={movieId}
                movieTitle={movie.title}
                moviePoster={movie.poster_path}
            />
        </>
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
});
