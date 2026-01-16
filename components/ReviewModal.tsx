import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Pressable,
} from 'react-native';
import { useState } from 'react';
import { Colors, TagColors } from '../constants/Colors';
import { ReviewTag } from '../types';
import { useReviewStore } from '../stores/reviewStore';
import { useCalendarStore } from '../stores/calendarStore';

const REVIEW_TAGS: ReviewTag[] = [
    '泣けた',
    '笑えた',
    '考えさせられた',
    'ハラハラした',
    '感動した',
    'ほっこりした',
    '衝撃的だった',
    '美しかった',
];

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    movieId: number;
    movieTitle: string;
    moviePoster: string | null;
}

export function ReviewModal({
    visible,
    onClose,
    movieId,
    movieTitle,
    moviePoster,
}: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<ReviewTag[]>([]);
    const { addReview } = useReviewStore();
    const { addRecord } = useCalendarStore();

    const handleTagPress = (tag: ReviewTag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter((t) => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = () => {
        if (rating === 0) return;

        const watchedAt = new Date().toISOString();

        // レビューを追加
        addReview({
            movie_id: movieId,
            movie_title: movieTitle,
            rating,
            content,
            tags: selectedTags,
            watched_at: watchedAt,
        });

        // カレンダーにも記録
        addRecord({
            movie_id: movieId,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            watched_at: watchedAt,
            rating,
        });

        // リセット
        setRating(0);
        setContent('');
        setSelectedTags([]);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={styles.title}>レビューを書く</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.movieTitle}>{movieTitle}</Text>

                        {/* 星評価 */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>評価</Text>
                            <View style={styles.ratingContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => setRating(star)}
                                        style={styles.starButton}
                                    >
                                        <Text style={styles.star}>
                                            {star <= rating ? '★' : '☆'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 感想タグ */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                タグを選択（最大3つ）
                            </Text>
                            <View style={styles.tagsContainer}>
                                {REVIEW_TAGS.map((tag) => (
                                    <TouchableOpacity
                                        key={tag}
                                        onPress={() => handleTagPress(tag)}
                                        style={[
                                            styles.tagButton,
                                            selectedTags.includes(tag) && {
                                                backgroundColor: TagColors[tag],
                                                borderColor: TagColors[tag],
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tagText,
                                                selectedTags.includes(tag) && styles.tagTextSelected,
                                            ]}
                                        >
                                            {tag}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 感想テキスト */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>感想（任意）</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="この映画についてどう思いましたか？"
                                placeholderTextColor={Colors.light.textMuted}
                                value={content}
                                onChangeText={setContent}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* 送信ボタン */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                rating === 0 && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={rating === 0}
                        >
                            <Text style={styles.submitButtonText}>レビューを投稿</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.light.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: Colors.light.textMuted,
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textMuted,
        marginBottom: 12,
    },
    ratingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    starButton: {
        padding: 8,
    },
    star: {
        fontSize: 36,
        color: '#FFD700',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.background,
    },
    tagText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    tagTextSelected: {
        color: '#FFF',
    },
    textInput: {
        backgroundColor: Colors.light.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: Colors.light.border,
        minHeight: 120,
    },
    submitButton: {
        backgroundColor: Colors.light.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
