import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 130;

interface MovieCardProps {
    movie: Movie;
    onPress?: (movie: Movie) => void;
    size?: 'normal' | 'small';
}

export function MovieCard({ movie, onPress, size = 'normal' }: MovieCardProps) {
    const imageUrl = getImageUrl(movie.poster_path, 'w342');
    const cardWidth = size === 'small' ? 100 : CARD_WIDTH;
    const cardHeight = size === 'small' ? 150 : 195;

    return (
        <TouchableOpacity
            style={[styles.container, { width: cardWidth }]}
            onPress={() => onPress?.(movie)}
            activeOpacity={0.8}
        >
            <View style={[styles.imageContainer, { height: cardHeight }]}>
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.poster} />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>MOVIE</Text>
                    </View>
                )}
            </View>

            {/* タイトル */}
            <Text style={styles.title} numberOfLines={2}>
                {movie.title}
            </Text>

            {/* 評価（Filmarks風の星表示） */}
            <View style={styles.ratingContainer}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    imageContainer: {
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: Colors.light.border,
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.light.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 32,
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.primary,
        marginTop: 6,
        lineHeight: 18,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    star: {
        fontSize: 14,
        color: Colors.light.star,
        marginRight: 2,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.star,
    },
});
