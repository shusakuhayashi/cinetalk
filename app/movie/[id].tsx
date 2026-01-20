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
    Modal,
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
import { FooterTabBar } from '../../components/FooterTabBar';
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
    const [showPosterModal, setShowPosterModal] = useState(false);
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
            <StaticHeader title="MOVIE DETAIL" showBackButton />

            <ScrollView
                style={styles.container}
                bounces={false}
                contentContainerStyle={{ paddingTop: 0 }}
            >
                {/* バックドロップ画像 */}
                <View style={[styles.backdropContainer, { marginTop: HEADER_HEIGHT + insets.top }]}>
                    {backdropUrl ? (
                        <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
                    ) : (
                        <View style={[styles.backdrop, styles.backdropPlaceholder]} />
                    )}
                    <View style={styles.backdropOverlay} />
                </View>

                {/* メイン情報 */}
                <View style={styles.mainInfo}>
                    <TouchableOpacity
                        style={styles.posterContainer}
                        onPress={() => posterUrl && setShowPosterModal(true)}
                        activeOpacity={0.9}
                    >
                        {posterUrl ? (
                            <Image source={{ uri: posterUrl }} style={styles.poster} />
                        ) : (
                            <View style={[styles.poster, styles.posterPlaceholder]}>
                                <Text style={styles.posterPlaceholderText}>MOVIE</Text>
                            </View>
                        )}
                    </TouchableOpacity>

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

                {/* ジャンル */}
                <View style={styles.genreRow}>
                    {movie.genres.map((genre) => (
                        <View key={genre.id} style={styles.genreBadge}>
                            <Text style={styles.genreText}>{genre.name}</Text>
                        </View>
                    ))}
                </View>

                {/* アクションボタン行（アイコン + この映画について話す） */}
                <View style={styles.actionRow}>
                    <View style={styles.iconButtons}>
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

                    {/* この映画について話す - ミニマルラインデザイン */}
                    <TouchableOpacity style={styles.talkButton} onPress={handleTalkAboutMovie}>
                        <View style={styles.talkButtonMicIcon}>
                            <View style={styles.micHead} />
                            <View style={styles.micStand} />
                            <View style={styles.micBase} />
                        </View>
                        <View style={styles.talkButtonContent}>
                            <Text style={styles.talkButtonTitle}>この映画について話す</Text>
                            <Text style={styles.talkButtonSubtitle}>音声レビューを投稿</Text>
                        </View>
                        <Text style={styles.talkButtonArrow}>›</Text>
                    </TouchableOpacity>
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

                {/* 配信サービス - Filmarksスタイル */}
                {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (() => {
                    // プロバイダーごとにタイプをまとめる
                    const providerMap = new Map<number, {
                        provider: WatchProvider;
                        types: ('flatrate' | 'rent' | 'buy')[];
                    }>();

                    watchProviders.flatrate?.forEach(p => {
                        const existing = providerMap.get(p.provider_id);
                        if (existing) {
                            existing.types.push('flatrate');
                        } else {
                            providerMap.set(p.provider_id, { provider: p, types: ['flatrate'] });
                        }
                    });

                    watchProviders.rent?.forEach(p => {
                        const existing = providerMap.get(p.provider_id);
                        if (existing) {
                            existing.types.push('rent');
                        } else {
                            providerMap.set(p.provider_id, { provider: p, types: ['rent'] });
                        }
                    });

                    watchProviders.buy?.forEach(p => {
                        const existing = providerMap.get(p.provider_id);
                        if (existing) {
                            existing.types.push('buy');
                        } else {
                            providerMap.set(p.provider_id, { provider: p, types: ['buy'] });
                        }
                    });

                    const providers = Array.from(providerMap.values());

                    return (
                        <View style={styles.providersSection}>
                            <Text style={styles.providersSectionTitle}>この映画を見る</Text>

                            {providers.map(({ provider, types }) => (
                                <View key={provider.provider_id} style={styles.providerCard}>
                                    <View style={styles.providerCardContent}>
                                        <Image
                                            source={{ uri: getImageUrl(provider.logo_path, 'w185')! }}
                                            style={styles.providerCardLogo}
                                        />
                                        <View style={styles.providerCardInfo}>
                                            <Text style={styles.providerCardName}>{provider.provider_name}</Text>
                                        </View>
                                        <View style={styles.providerCardBadges}>
                                            {types.includes('flatrate') && (
                                                <View style={[styles.providerBadge, styles.providerBadgeFlatrate]}>
                                                    <Text style={styles.providerBadgeText}>見放題</Text>
                                                </View>
                                            )}
                                            {types.includes('rent') && (
                                                <View style={[styles.providerBadge, styles.providerBadgeRent]}>
                                                    <Text style={styles.providerBadgeText}>レンタル</Text>
                                                </View>
                                            )}
                                            {types.includes('buy') && (
                                                <View style={[styles.providerBadge, styles.providerBadgeBuy]}>
                                                    <Text style={styles.providerBadgeText}>購入</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.providerCardButton}
                                        onPress={() => Linking.openURL(getProviderUrl(provider.provider_id, movie.title))}
                                    >
                                        <Text style={styles.providerCardButtonText}>
                                            {provider.provider_name}で今すぐ見る
                                        </Text>
                                        <Text style={styles.providerCardButtonArrow}>›</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    );
                })()}

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

            {/* ポスター拡大モーダル */}
            <Modal
                visible={showPosterModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPosterModal(false)}
            >
                <TouchableOpacity
                    style={styles.posterModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPosterModal(false)}
                >
                    <View style={styles.posterModalContent}>
                        {posterUrl && (
                            <Image
                                source={{ uri: getImageUrl(movie?.poster_path, 'w780') || posterUrl }}
                                style={styles.posterModalImage}
                                resizeMode="contain"
                            />
                        )}
                    </View>
                    <TouchableOpacity
                        style={styles.posterModalCloseButton}
                        onPress={() => setShowPosterModal(false)}
                    >
                        <Text style={styles.posterModalCloseText}>✕</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* フッタータブバー */}
            <FooterTabBar />
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
        alignItems: 'flex-start',
    },
    posterContainer: {
        width: 120,
        height: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderRadius: 12,
        overflow: 'hidden',
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
    // アクションボタン行（アイコン + この映画について話す）
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 12,
    },
    iconButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    // 小型アイコンボタン（お気に入り・あとで見る）
    smallActionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 12,
    },
    smallActionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 18,
        color: Colors.light.primary,
    },
    smallActionIconActive: {
        color: '#FFFFFF',
    },
    // この映画について話す - ミニマルラインデザイン
    talkButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    talkButtonMicIcon: {
        width: 24,
        height: 32,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginRight: 14,
    },
    micHead: {
        width: 12,
        height: 16,
        borderWidth: 1.5,
        borderColor: '#333',
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    micStand: {
        width: 1.5,
        height: 6,
        backgroundColor: '#333',
        marginTop: 2,
    },
    micBase: {
        width: 14,
        height: 1.5,
        backgroundColor: '#333',
        borderRadius: 1,
    },
    talkButtonContent: {
        flex: 1,
    },
    talkButtonTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
        letterSpacing: 0.3,
    },
    talkButtonSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    talkButtonArrow: {
        fontSize: 22,
        color: '#999',
        fontWeight: '300',
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
    genreRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 8,
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
        marginBottom: 16,
    },
    providerCategoryLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.light.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    providerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    providerGridItem: {
        alignItems: 'center',
    },
    providerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2a2a2a',
        overflow: 'hidden',
    },
    providerGridLogo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    // Filmarksスタイルのプロバイダーカード
    providerCard: {
        backgroundColor: Colors.light.cardBg,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        overflow: 'hidden',
    },
    providerCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    providerCardLogo: {
        width: 48,
        height: 48,
        borderRadius: 8,
    },
    providerCardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    providerCardName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    providerCardBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    providerBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
    },
    providerBadgeFlatrate: {
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        borderColor: '#ea580c',
    },
    providerBadgeRent: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
    },
    providerBadgeBuy: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: '#22c55e',
    },
    providerBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    providerCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        backgroundColor: Colors.light.surface,
    },
    providerCardButtonText: {
        fontSize: 13,
        color: Colors.light.textMuted,
    },
    providerCardButtonArrow: {
        fontSize: 20,
        color: Colors.light.textMuted,
    },
    // ポスター拡大モーダル
    posterModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterModalContent: {
        width: width * 0.85,
        aspectRatio: 2 / 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterModalImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    posterModalCloseButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterModalCloseText: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '300',
    },
});
