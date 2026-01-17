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
import { MoodCategory } from '../data/moodCategories';

interface MoodSectionProps {
    moodMovies: { mood: MoodCategory; movie: Movie | null }[];
    onMoviePress: (movie: Movie) => void;
}

export const MoodSection: React.FC<MoodSectionProps> = ({ moodMovies, onMoviePress }) => {
    if (moodMovies.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>TODAY'S MOOD PICKS</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {moodMovies.map(({ mood, movie }) => (
                    <TouchableOpacity
                        key={mood.id}
                        style={styles.moodCard}
                        onPress={() => movie && onMoviePress(movie)}
                        disabled={!movie}
                    >
                        <View style={styles.moodHeader}>
                            <Text style={styles.moodLabel}>{mood.labelJa}</Text>
                        </View>
                        {movie ? (
                            <View style={styles.movieContainer}>
                                {movie.poster_path && (
                                    <Image
                                        source={{ uri: getImageUrl(movie.poster_path, 'w185') || '' }}
                                        style={styles.poster}
                                    />
                                )}
                                <Text style={styles.movieTitle} numberOfLines={2}>
                                    {movie.title}
                                </Text>
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.rating}>{movie.vote_average.toFixed(1)}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.noMovieContainer}>
                                <Text style={styles.noMovieText}>読み込み中...</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
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
    scrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    moodCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        padding: 12,
        width: 140,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    moodHeader: {
        alignItems: 'center',
        marginBottom: 12,
    },
    moodLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.textMuted,
        textAlign: 'center',
    },
    movieContainer: {
        alignItems: 'center',
    },
    poster: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    movieTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
        textAlign: 'center',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.star,
    },
    noMovieContainer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMovieText: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
});
