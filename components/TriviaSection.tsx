import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';

interface TriviaSectionProps {
    movie: Movie | null;
    trivia: {
        budget: number;
        revenue: number;
        productionCountries: string[];
        productionCompanies: string[];
        tagline: string;
    } | null;
    onMoviePress: (movie: Movie) => void;
}

// 数値を金額表示にフォーマット
const formatCurrency = (amount: number): string => {
    if (amount === 0) return '非公開';
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)}B ドル`;
    }
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(0)}M ドル`;
    }
    return `${amount.toLocaleString()} ドル`;
};

export const TriviaSection: React.FC<TriviaSectionProps> = ({
    movie,
    trivia,
    onMoviePress,
}) => {
    if (!movie || !trivia) return null;

    // 表示するトリビアがない場合は非表示
    const hasTrivia = trivia.budget > 0 || trivia.revenue > 0 || trivia.tagline;
    if (!hasTrivia) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>TODAY'S TRIVIA</Text>
            <TouchableOpacity
                style={styles.triviaCard}
                onPress={() => onMoviePress(movie)}
            >
                <View style={styles.triviaHeader}>
                    {movie.poster_path && (
                        <Image
                            source={{ uri: getImageUrl(movie.poster_path, 'w185') || '' }}
                            style={styles.poster}
                        />
                    )}
                    <View style={styles.triviaHeaderInfo}>
                        <Text style={styles.movieTitle}>{movie.title}</Text>
                        <Text style={styles.movieYear}>
                            {movie.release_date?.split('-')[0]}年
                        </Text>
                        {trivia.tagline && (
                            <Text style={styles.tagline} numberOfLines={2}>
                                "{trivia.tagline}"
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.triviaContent}>
                    {trivia.budget > 0 && (
                        <View style={styles.triviaItem}>
                            <Text style={styles.triviaLabel}>製作費</Text>
                            <Text style={styles.triviaValue}>{formatCurrency(trivia.budget)}</Text>
                        </View>
                    )}
                    {trivia.revenue > 0 && (
                        <View style={styles.triviaItem}>
                            <Text style={styles.triviaLabel}>興行収入</Text>
                            <Text style={styles.triviaValue}>{formatCurrency(trivia.revenue)}</Text>
                        </View>
                    )}
                    {trivia.revenue > 0 && trivia.budget > 0 && (
                        <View style={styles.triviaItem}>
                            <Text style={styles.triviaLabel}>収益率</Text>
                            <Text style={[
                                styles.triviaValue,
                                trivia.revenue > trivia.budget ? styles.positive : styles.negative
                            ]}>
                                {((trivia.revenue / trivia.budget) * 100).toFixed(0)}%
                            </Text>
                        </View>
                    )}
                    {trivia.productionCountries.length > 0 && (
                        <View style={styles.triviaItem}>
                            <Text style={styles.triviaLabel}>製作国</Text>
                            <Text style={styles.triviaValue}>
                                {trivia.productionCountries.slice(0, 2).join(', ')}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    triviaCard: {
        backgroundColor: Colors.light.surface,
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    triviaHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    poster: {
        width: 60,
        height: 90,
        borderRadius: 6,
    },
    triviaHeaderInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    movieYear: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 12,
        fontStyle: 'italic',
        color: Colors.light.accent,
    },
    triviaContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    triviaItem: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: '45%',
    },
    triviaLabel: {
        fontSize: 10,
        color: Colors.light.textMuted,
        marginBottom: 2,
    },
    triviaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    positive: {
        color: '#4CAF50',
    },
    negative: {
        color: '#F44336',
    },
});
