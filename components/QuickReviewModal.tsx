import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Image,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { Movie } from '../types';
import { getImageUrl } from '../services/tmdb';
import { useReviewStore } from '../stores/reviewStore';
import { useCalendarStore } from '../stores/calendarStore';

interface QuickReviewModalProps {
    visible: boolean;
    movie: Movie | null;
    onClose: () => void;
}

export const QuickReviewModal: React.FC<QuickReviewModalProps> = ({
    visible,
    movie,
    onClose,
}) => {
    const [rating, setRating] = useState(3);
    const [reviewText, setReviewText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addReview } = useReviewStore();
    const { addRecord } = useCalendarStore();

    const handleRatingPress = (value: number) => {
        setRating(value);
    };

    const handleMicPress = () => {
        // 音声録音機能（簡易実装）
        setIsRecording(!isRecording);
        if (isRecording) {
            // 録音停止後にダミーテキストを追加（実際は音声認識結果を使用）
            setReviewText((prev) => prev + ' （音声入力）');
        }
    };

    const handleSubmit = async () => {
        if (!movie) return;

        setIsSubmitting(true);

        // レビューを保存
        addReview({
            movie_id: movie.id,
            movie_title: movie.title,
            rating: rating,
            content: reviewText || '視聴しました',
            tags: [],
            watched_at: new Date().toISOString(),
        });

        // 視聴記録を保存
        addRecord({
            movie_id: movie.id,
            movie_title: movie.title,
            movie_poster: movie.poster_path,
            watched_at: new Date().toISOString(),
        });

        setIsSubmitting(false);
        setRating(3);
        setReviewText('');
        onClose();
    };

    const handleClose = () => {
        setRating(3);
        setReviewText('');
        onClose();
    };

    if (!movie) return null;

    const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, 'w185') : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark">
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalContainer}>
                                {/* ヘッダー：映画情報 */}
                                <View style={styles.header}>
                                    {posterUrl && (
                                        <Image
                                            source={{ uri: posterUrl }}
                                            style={styles.posterImage}
                                        />
                                    )}
                                    <View style={styles.movieInfo}>
                                        <Text style={styles.movieTitle} numberOfLines={2}>
                                            {movie.title}
                                        </Text>
                                        <Text style={styles.movieYear}>
                                            {movie.release_date?.split('-')[0] || ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={handleClose}
                                    >
                                        <Text style={styles.closeButtonText}>×</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* 評価セクション */}
                                <View style={styles.ratingSection}>
                                    <Text style={styles.sectionLabel}>評価</Text>
                                    <View style={styles.starsContainer}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <TouchableOpacity
                                                key={star}
                                                onPress={() => handleRatingPress(star)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.star,
                                                        star <= rating && styles.starActive,
                                                    ]}
                                                >
                                                    ★
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* レビュー入力 */}
                                <View style={styles.reviewSection}>
                                    <Text style={styles.sectionLabel}>感想</Text>
                                    <TextInput
                                        style={styles.reviewInput}
                                        placeholder="感想を入力（任意）"
                                        placeholderTextColor={Colors.light.textMuted}
                                        multiline
                                        numberOfLines={3}
                                        value={reviewText}
                                        onChangeText={setReviewText}
                                    />
                                </View>

                                {/* 音声入力ボタン */}
                                <TouchableOpacity
                                    style={[
                                        styles.micButton,
                                        isRecording && styles.micButtonRecording,
                                    ]}
                                    onPress={handleMicPress}
                                >
                                    <Text style={styles.micIcon}>◉</Text>
                                    <Text style={styles.micText}>
                                        {isRecording ? '録音中...' : '音声で入力'}
                                    </Text>
                                </TouchableOpacity>

                                {/* 送信ボタン */}
                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>
                                            レビューを保存
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: Colors.light.surface,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    posterImage: {
        width: 60,
        height: 90,
        borderRadius: 6,
    },
    movieInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    movieYear: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: Colors.light.textMuted,
        lineHeight: 22,
    },
    ratingSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    star: {
        fontSize: 32,
        color: Colors.light.border,
    },
    starActive: {
        color: Colors.light.star,
    },
    reviewSection: {
        marginBottom: 16,
    },
    reviewInput: {
        backgroundColor: Colors.light.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: Colors.light.text,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    micButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    micButtonRecording: {
        backgroundColor: '#FFEBEE',
    },
    micIcon: {
        fontSize: 20,
    },
    micText: {
        fontSize: 14,
        color: Colors.light.text,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: Colors.light.primary,
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
