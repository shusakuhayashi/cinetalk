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

interface AnniversarySectionProps {
    anniversaryMovies: { movie: Movie; years: number }[];
    onMoviePress: (movie: Movie) => void;
}

export const AnniversarySection: React.FC<AnniversarySectionProps> = ({
    anniversaryMovies,
    onMoviePress,
}) => {
    if (anniversaryMovies.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>ANNIVERSARY</Text>
            <Text style={styles.subtitle}>今日公開された名作たち</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {anniversaryMovies.map(({ movie, years }) => (
                    <TouchableOpacity
                        key={movie.id}
                        style={styles.movieCard}
                        onPress={() => onMoviePress(movie)}
                    >
                        <View style={styles.yearBadge}>
                            <Text style={styles.yearText}>{years}年前</Text>
                        </View>
                        {movie.poster_path && (
                            <Image
                                source={{ uri: getImageUrl(movie.poster_path, 'w342') || '' }}
                                style={styles.poster}
                            />
                        )}
                        <View style={styles.movieInfo}>
                            <Text style={styles.movieTitle} numberOfLines={2}>
                                {movie.title}
                            </Text>
                            <Text style={styles.releaseYear}>
                                {movie.release_date?.split('-')[0]}年公開
                            </Text>
                            <View style={styles.ratingContainer}>
                                <Text style={styles.rating}>{movie.vote_average.toFixed(1)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 32,
        marginBottom: 8,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 2,
        color: Colors.light.primary,
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: Colors.light.textMuted,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    movieCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        overflow: 'hidden',
        width: 160,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    yearBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.light.accent,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 1,
    },
    yearText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    poster: {
        width: 160,
        height: 220,
    },
    movieInfo: {
        padding: 12,
    },
    movieTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    releaseYear: {
        fontSize: 11,
        color: Colors.light.textMuted,
        marginBottom: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.star,
    },
});
