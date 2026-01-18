import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MoodCategory } from '../data/moodCategories';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { useCalendarStore } from '../stores/calendarStore';
import { useMovieListStore } from '../stores/movieListStore';
import { useReviewStore } from '../stores/reviewStore';
import { QuickReviewModal } from './QuickReviewModal';

const CARD_WIDTH = 280;
const POSTER_WIDTH = 100;

interface MoodSectionProps {
    moodMovies: { mood: MoodCategory; movie: Movie | null }[];
    onMoviePress: (movie: Movie) => void;
}


export const MoodSection: React.FC<MoodSectionProps> = ({ moodMovies, onMoviePress }) => {
    const { records } = useCalendarStore();
    const { isInWatchlist, toggleWatchlist } = useMovieListStore();
    const { getReviewByMovieId } = useReviewStore();

    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedMovieForReview, setSelectedMovieForReview] = useState<Movie | null>(null);

    const hasWatched = (movieId: number) => {
        return records.some((r) => r.movie_id === movieId);
    };

    const hasReview = (movieId: number) => {
        return !!getReviewByMovieId(movieId);
    };

    const handleWatchlistToggle = (movie: Movie) => {
        toggleWatchlist({
            movie_id: movie.id,
            movie_title: movie.title,
            movie_poster: movie.poster_path,
        });
    };

    const handleOpenReviewModal = (movie: Movie) => {
        setSelectedMovieForReview(movie);
        setReviewModalVisible(true);
    };

    const handleCloseReviewModal = () => {
        setReviewModalVisible(false);
        setSelectedMovieForReview(null);
    };

    if (moodMovies.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>MOOD PICKS</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {moodMovies.map(({ mood, movie }) => {
                    const posterUrl = movie?.poster_path ? getImageUrl(movie.poster_path, 'w185') : null;
                    const watched = movie ? hasWatched(movie.id) : false;
                    const inWatchlist = movie ? isInWatchlist(movie.id) : false;
                    const reviewed = movie ? hasReview(movie.id) : false;

                    return (
                        <TouchableOpacity
                            key={mood.id}
                            style={styles.card}
                            onPress={() => movie && onMoviePress(movie)}
                            disabled={!movie}
                            activeOpacity={0.8}
                        >
                            {/* ラベル（カード上部） */}
                            <View style={styles.labelContainer}>
                                <Text style={styles.labelText}>{mood.label}</Text>
                            </View>

                            {/* コンテンツエリア：左ポスター + 右あらすじ */}
                            <View style={styles.contentRow}>
                                {/* 左側：ポスター */}
                                {movie && posterUrl ? (
                                    <Image
                                        source={{ uri: posterUrl }}
                                        style={styles.posterImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.posterPlaceholder}>
                                        <Text style={styles.placeholderText}>-</Text>
                                    </View>
                                )}

                                {/* 右側：あらすじのみ */}
                                {movie && (
                                    <View style={styles.synopsisContainer}>
                                        <Text style={styles.overview} numberOfLines={9}>
                                            {movie.overview || 'あらすじはありません'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* フッター行：タイトル（左端） + アイコン（右端：♡・✎・★点数） */}
                            {movie && (
                                <View style={styles.footerRow}>
                                    <Text style={styles.movieTitle} numberOfLines={1}>
                                        {movie.title}
                                    </Text>
                                    <View style={styles.iconGroup}>
                                        {/* ハート */}
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleWatchlistToggle(movie);
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Text
                                                style={[
                                                    styles.heartIcon,
                                                    (inWatchlist || watched) && styles.heartIconActive,
                                                ]}
                                            >
                                                {inWatchlist || watched ? '♥' : '♡'}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* ペン */}
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleOpenReviewModal(movie);
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Text
                                                style={[
                                                    styles.penIcon,
                                                    reviewed && styles.penIconActive,
                                                ]}
                                            >
                                                ✎
                                            </Text>
                                        </TouchableOpacity>

                                        {/* 点数 */}
                                        <View style={styles.ratingItem}>
                                            <Text style={styles.ratingStar}>★</Text>
                                            <Text style={styles.ratingText}>
                                                {movie.vote_average?.toFixed(1) || '-'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <QuickReviewModal
                visible={reviewModalVisible}
                movie={selectedMovieForReview}
                onClose={handleCloseReviewModal}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    card: {
        marginHorizontal: 6,
        width: CARD_WIDTH,
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        overflow: 'hidden',
    },
    labelContainer: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    contentRow: {
        flexDirection: 'row',
        height: 150,
    },
    posterImage: {
        width: POSTER_WIDTH,
        height: 150,
    },
    posterPlaceholder: {
        width: POSTER_WIDTH,
        height: 150,
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    synopsisContainer: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    overview: {
        fontSize: 10,
        color: Colors.light.textMuted,
        lineHeight: 14,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    movieTitle: {
        flex: 1,
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.text,
        marginRight: 8,
    },
    iconGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heartIcon: {
        fontSize: 16,
        color: Colors.light.textMuted,
    },
    heartIconActive: {
        color: '#FF3B5C',
    },
    penIcon: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    penIconActive: {
        color: Colors.light.primary,
    },
    ratingItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStar: {
        fontSize: 12,
        color: Colors.light.star,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.star,
    },
});
