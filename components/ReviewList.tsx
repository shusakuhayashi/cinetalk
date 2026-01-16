import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
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
    showOriginal: boolean;
}

// 言語コードを日本語名に変換
const LANGUAGE_NAMES: Record<string, string> = {
    en: '英語',
    es: 'スペイン語',
    fr: 'フランス語',
    de: 'ドイツ語',
    it: 'イタリア語',
    pt: 'ポルトガル語',
    ru: 'ロシア語',
    zh: '中国語',
    ko: '韓国語',
};

const getLanguageName = (code: string | undefined): string => {
    if (!code) return '外国語';
    return LANGUAGE_NAMES[code] || code.toUpperCase();
};

// 個別レビューコンポーネント（アニメーション対応）
function ReviewItem({ review, onToggle }: { review: DisplayReview; onToggle: () => void }) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [displayedContent, setDisplayedContent] = useState(review.content);

    // 翻訳完了時にスムーズに切り替え
    useEffect(() => {
        if (review.isTranslated && review.translatedContent && !review.showOriginal) {
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

    // 原文/翻訳切り替え時
    useEffect(() => {
        if (review.isTranslated) {
            Animated.timing(fadeAnim, {
                toValue: 0.3,
                duration: 100,
                useNativeDriver: true,
            }).start(() => {
                setDisplayedContent(
                    review.showOriginal ? review.content : (review.translatedContent || review.content)
                );
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [review.showOriginal]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    const truncateContent = (content: string, maxLength = 300) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    const rating = review.author_details.rating;
    const languageName = getLanguageName(review.iso_639_1);
    const needsTranslation = !isJapanese(review.content);

    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>
                        👤 {review.author_details.name || review.author}
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

            {/* 翻訳バッジ（翻訳完了後のみ表示） */}
            {review.isTranslated && (
                <TouchableOpacity style={styles.translatedBadge} onPress={onToggle} activeOpacity={0.7}>
                    <Text style={styles.translatedBadgeText}>
                        {review.showOriginal
                            ? '🌐 翻訳を表示'
                            : `🌐 ${languageName}から翻訳（原文を表示）`}
                    </Text>
                </TouchableOpacity>
            )}

            {/* 翻訳中のインジケータ（小さく控えめに） */}
            {needsTranslation && !review.isTranslated && (
                <View style={styles.translatingIndicator}>
                    <ActivityIndicator size="small" color={Colors.light.accent} />
                    <Text style={styles.translatingText}>翻訳中</Text>
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
                showOriginal: false,
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

    const toggleOriginal = (reviewId: string) => {
        setReviews((prev) =>
            prev.map((r) => (r.id === reviewId ? { ...r, showOriginal: !r.showOriginal } : r))
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.light.accent} />
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
                <ReviewItem
                    key={review.id}
                    review={review}
                    onToggle={() => toggleOriginal(review.id)}
                />
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
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    authorName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    rating: {
        fontSize: 13,
        color: Colors.light.star,
        fontWeight: '600',
    },
    date: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    content: {
        fontSize: 14,
        lineHeight: 21,
        color: Colors.light.text,
    },
    translatedBadge: {
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: Colors.light.accent + '15',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    translatedBadgeText: {
        fontSize: 11,
        color: Colors.light.accent,
        fontWeight: '500',
    },
    translatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    translatingText: {
        fontSize: 11,
        color: Colors.light.textMuted,
    },
});
