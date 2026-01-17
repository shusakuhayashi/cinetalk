import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '../constants/Colors';
import { TMDbReview, getMovieReviews, sortReviewsByLanguage, isJapanese } from '../services/tmdb';
import { translateToJapanese } from '../services/translate';

interface ReviewListProps {
    movieId: number;
}

interface DisplayReview extends TMDbReview {
    translatedContent?: string;
    isTranslated: boolean;
}

// 個別レビューコンポーネント（アニメーション対応）
function ReviewItem({ review }: { review: DisplayReview }) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [displayedContent, setDisplayedContent] = useState(review.content);

    // 翻訳完了時にスムーズに切り替え
    useEffect(() => {
        if (review.isTranslated && review.translatedContent) {
            // フェードアウト
            Animated.timing(fadeAnim, {
                toValue: 0.3,
                duration: 150,
                useNativeDriver: true,
            }).start(() => {
                setDisplayedContent(review.translatedContent!);
                // フェードイン
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [review.isTranslated, review.translatedContent]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    const truncateContent = (content: string, maxLength = 300) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    const rating = review.author_details.rating;
    const needsTranslation = !isJapanese(review.content);

    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>
                        {review.author_details.name || review.author}
                    </Text>
                    {rating !== null && (
                        <Text style={styles.rating}>★ {(rating / 2).toFixed(1)}</Text>
                    )}
                </View>
                <Text style={styles.date}>{formatDate(review.created_at)}</Text>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.content}>{truncateContent(displayedContent)}</Text>
            </Animated.View>

            {/* 翻訳中のインジケータ */}
            {needsTranslation && !review.isTranslated && (
                <View style={styles.translatingIndicator}>
                    <ActivityIndicator size="small" color={Colors.light.textMuted} />
                    <Text style={styles.translatingText}>翻訳中...</Text>
                </View>
            )}
        </View>
    );
}

export function ReviewList({ movieId }: ReviewListProps) {
    const [reviews, setReviews] = useState<DisplayReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [movieId]);

    const fetchReviews = async () => {
        try {
            const data = await getMovieReviews(movieId);
            const sorted = sortReviewsByLanguage(data.results);
            const displayReviews: DisplayReview[] = sorted.slice(0, 10).map((r) => ({
                ...r,
                isTranslated: false,
            }));
            setReviews(displayReviews);
            setLoading(false);

            // 日本語以外のレビューを並列で翻訳
            translateNonJapaneseReviews(displayReviews);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            setLoading(false);
        }
    };

    const translateNonJapaneseReviews = async (allReviews: DisplayReview[]) => {
        const nonJapanese = allReviews.filter((r) => !isJapanese(r.content)).slice(0, 5);

        const translationPromises = nonJapanese.map(async (review) => {
            try {
                const translated = await translateToJapanese(review.content);
                return { id: review.id, translated };
            } catch (error) {
                return { id: review.id, translated: null };
            }
        });

        const results = await Promise.all(translationPromises);

        setReviews((prev) =>
            prev.map((r) => {
                const result = results.find((res) => res.id === r.id);
                if (result && result.translated) {
                    return { ...r, translatedContent: result.translated, isTranslated: true };
                }
                return r;
            })
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.textMuted} />
            </View>
        );
    }

    if (reviews.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>レビューはまだありません</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.light.textMuted,
        fontSize: 14,
    },
    reviewItem: {
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    authorName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    rating: {
        fontSize: 12,
        color: Colors.light.star,
        fontWeight: '600',
    },
    date: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    content: {
        fontSize: 13,
        lineHeight: 20,
        color: Colors.light.text,
    },
    translatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    translatingText: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
});
