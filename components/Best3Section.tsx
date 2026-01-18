import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { DirectorData, EraCountryData, HiddenGemGenre } from '../data/best3Categories';

interface Best3SectionProps {
    // 監督の傑作BEST3
    director: DirectorData | null;
    directorMovies: Movie[];
    // 年代別×国別BEST3
    eraCountry: EraCountryData | null;
    eraCountryMovies: Movie[];
    // 隠れた名作BEST3
    hiddenGemGenre: HiddenGemGenre | null;
    hiddenGemMovies: Movie[];
    // 映画押下時のコールバック
    onMoviePress: (movie: Movie) => void;
}

// ランキングカード（共通）
const RankingCard: React.FC<{
    rank: number;
    movie: Movie;
    onPress: (movie: Movie) => void;
}> = ({ rank, movie, onPress }) => {
    const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, 'w185') : null;

    return (
        <TouchableOpacity
            style={styles.rankingCard}
            onPress={() => onPress(movie)}
            activeOpacity={0.7}
        >
            <View style={styles.rankBadge}>
                <Text style={styles.rankNumber}>{rank}</Text>
            </View>
            {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.poster} />
            ) : (
                <View style={[styles.poster, styles.posterPlaceholder]}>
                    <Text style={styles.placeholderText}>-</Text>
                </View>
            )}
            <Text style={styles.movieTitle} numberOfLines={2}>
                {movie.title}
            </Text>
            <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>★</Text>
                <Text style={styles.ratingText}>
                    {movie.vote_average?.toFixed(1) || '-'}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

// Best3セクション（タイトル + 3つのカード）
const Best3List: React.FC<{
    title: string;
    subtitle?: string;
    movies: Movie[];
    onMoviePress: (movie: Movie) => void;
}> = ({ title, subtitle, movies, onMoviePress }) => {
    if (movies.length === 0) return null;

    return (
        <View style={styles.best3Container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {subtitle && (
                    <Text style={styles.sectionSubtitle}>{subtitle}</Text>
                )}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsContainer}
            >
                {movies.slice(0, 3).map((movie, index) => (
                    <RankingCard
                        key={movie.id}
                        rank={index + 1}
                        movie={movie}
                        onPress={onMoviePress}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

export const Best3Section: React.FC<Best3SectionProps> = ({
    director,
    directorMovies,
    eraCountry,
    eraCountryMovies,
    hiddenGemGenre,
    hiddenGemMovies,
    onMoviePress,
}) => {
    // 何もデータがない場合は非表示
    if (
        directorMovies.length === 0 &&
        eraCountryMovies.length === 0 &&
        hiddenGemMovies.length === 0
    ) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* 監督の傑作BEST3 */}
            {director && directorMovies.length > 0 && (
                <Best3List
                    title="監督の傑作 BEST3"
                    subtitle={director.nameJa}
                    movies={directorMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 年代別×国別BEST3 */}
            {eraCountry && eraCountryMovies.length > 0 && (
                <Best3List
                    title="年代別名作 BEST3"
                    subtitle={eraCountry.label}
                    movies={eraCountryMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 隠れた名作BEST3 */}
            {hiddenGemGenre && hiddenGemMovies.length > 0 && (
                <Best3List
                    title="隠れた名作 BEST3"
                    subtitle={hiddenGemGenre.nameJa}
                    movies={hiddenGemMovies}
                    onMoviePress={onMoviePress}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 8,
    },
    best3Container: {
        marginBottom: 28,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 4,
    },
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    rankingCard: {
        width: 110,
        marginHorizontal: 4,
        position: 'relative',
    },
    rankBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    rankNumber: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    poster: {
        width: 110,
        height: 165,
        borderRadius: 8,
        marginBottom: 6,
    },
    posterPlaceholder: {
        backgroundColor: Colors.light.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: Colors.light.textMuted,
        fontSize: 24,
    },
    movieTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.light.text,
        lineHeight: 14,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStar: {
        fontSize: 11,
        color: Colors.light.star,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.light.star,
    },
});
