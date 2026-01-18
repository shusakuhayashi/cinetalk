import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { useMovieListStore } from '../stores/movieListStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 130;
const DOUBLE_TAP_DELAY = 300;

interface MovieCardProps {
    movie: Movie;
    onPress?: (movie: Movie) => void;
    size?: 'normal' | 'small';
}

export function MovieCard({ movie, onPress, size = 'normal' }: MovieCardProps) {
    const imageUrl = getImageUrl(movie.poster_path, 'w342');
    const cardWidth = size === 'small' ? 100 : CARD_WIDTH;
    const cardHeight = size === 'small' ? 150 : 195;

    // ダブルタップ検出用
    const lastTap = useRef<number>(0);
    const [showHeart, setShowHeart] = useState(false);
    const heartScale = useRef(new Animated.Value(0)).current;

    // Store
    const { isFavorite, toggleFavorite } = useMovieListStore();
    const isMovieFavorite = isFavorite(movie.id);

    const handlePress = useCallback(() => {
        const now = Date.now();
        if (now - lastTap.current < DOUBLE_TAP_DELAY) {
            // ダブルタップ → お気に入りトグル
            const wasAdded = toggleFavorite({
                movie_id: movie.id,
                movie_title: movie.title,
                movie_poster: movie.poster_path,
            });

            // ハートアニメーション（追加時のみ）
            if (wasAdded) {
                setShowHeart(true);
                Animated.sequence([
                    Animated.spring(heartScale, {
                        toValue: 1,
                        friction: 3,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heartScale, {
                        toValue: 0,
                        duration: 300,
                        delay: 500,
                        useNativeDriver: true,
                    }),
                ]).start(() => setShowHeart(false));
            }
        } else {
            // シングルタップ → 通常のonPress（遅延なし）
            onPress?.(movie);
        }
        lastTap.current = now;
    }, [movie, onPress, toggleFavorite, heartScale]);

    return (
        <TouchableOpacity
            style={[styles.container, { width: cardWidth }]}
            onPress={handlePress}
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

                {/* お気に入りインジケーター */}
                {isMovieFavorite && (
                    <View style={styles.favoriteIndicator}>
                        <Text style={styles.favoriteHeart}>♥</Text>
                    </View>
                )}

                {/* ダブルタップ時のハートアニメーション */}
                {showHeart && (
                    <Animated.View
                        style={[
                            styles.doubleTapHeart,
                            { transform: [{ scale: heartScale }] },
                        ]}
                    >
                        <Text style={styles.doubleTapHeartText}>♥</Text>
                    </Animated.View>
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
        position: 'relative',
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
    favoriteIndicator: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    favoriteHeart: {
        fontSize: 14,
        color: '#FF3B5C',
    },
    doubleTapHeart: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doubleTapHeartText: {
        fontSize: 60,
        color: '#FF3B5C',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
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
