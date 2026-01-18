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
import { DirectorData, EraCountryData, HiddenGemGenre, JapaneseMovieGenre, WorldCinemaCountry } from '../data/best3Categories';


interface Best5SectionProps {
    // 監督の傑作BEST5
    director: DirectorData | null;
    directorMovies: Movie[];
    // 年代別×国別BEST5
    eraCountry: EraCountryData | null;
    eraCountryMovies: Movie[];
    // 隠れた名作BEST5
    hiddenGemGenre: HiddenGemGenre | null;
    hiddenGemMovies: Movie[];
    // 世界の映画BEST5
    worldCinemaCountry: WorldCinemaCountry | null;
    worldCinemaMovies: Movie[];
    // 日本映画BEST5
    japaneseMovieGenre: JapaneseMovieGenre | null;
    japaneseMovies: Movie[];
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

// Best5セクション（タイトル + 5つのカード）
const Best5List: React.FC<{
    title: string;
    subtitle?: string;
    movies: Movie[];
    onMoviePress: (movie: Movie) => void;
}> = ({ title, subtitle, movies, onMoviePress }) => {
    if (movies.length === 0) return null;

    return (
        <View style={styles.best5Container}>
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
                {movies.slice(0, 5).map((movie, index) => (
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

export const Best5Section: React.FC<Best5SectionProps> = ({
    director,
    directorMovies,
    eraCountry,
    eraCountryMovies,
    hiddenGemGenre,
    hiddenGemMovies,
    worldCinemaCountry,
    worldCinemaMovies,
    japaneseMovieGenre,
    japaneseMovies,
    onMoviePress,
}) => {
    // 何もデータがない場合は非表示
    if (
        directorMovies.length === 0 &&
        eraCountryMovies.length === 0 &&
        hiddenGemMovies.length === 0 &&
        worldCinemaMovies.length === 0 &&
        japaneseMovies.length === 0
    ) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* 1. 監督の傑作BEST5 */}
            {director && directorMovies.length > 0 && (
                <Best5List
                    title="監督の傑作 BEST5"
                    subtitle={director.nameJa}
                    movies={directorMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 2. 年代別×国別BEST5 */}
            {eraCountry && eraCountryMovies.length > 0 && (
                <Best5List
                    title="年代別名作 BEST5"
                    subtitle={eraCountry.label}
                    movies={eraCountryMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 3. 隠れた名作BEST5 */}
            {hiddenGemGenre && hiddenGemMovies.length > 0 && (
                <Best5List
                    title="隠れた名作 BEST5"
                    subtitle={hiddenGemGenre.nameJa}
                    movies={hiddenGemMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 4. 世界の映画BEST5 */}
            {worldCinemaCountry && worldCinemaMovies.length > 0 && (
                <Best5List
                    title="世界の映画 BEST5"
                    subtitle={worldCinemaCountry.nameJa}
                    movies={worldCinemaMovies}
                    onMoviePress={onMoviePress}
                />
            )}

            {/* 5. 日本映画BEST5 */}
            {japaneseMovieGenre && japaneseMovies.length > 0 && (
                <Best5List
                    title="日本映画 BEST5"
                    subtitle={japaneseMovieGenre.nameJa}
                    movies={japaneseMovies}
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
    best5Container: {
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
        width: 100,
        marginHorizontal: 4,
        position: 'relative',
    },
    rankBadge: {
        position: 'absolute',
        top: -4,
        left: -4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    rankNumber: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    poster: {
        width: 100,
        height: 150,
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
        fontSize: 10,
        fontWeight: '600',
        color: Colors.light.text,
        lineHeight: 13,
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStar: {
        fontSize: 10,
        color: Colors.light.star,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.light.star,
    },
});
