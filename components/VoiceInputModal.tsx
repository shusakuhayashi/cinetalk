import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { voiceRecognition } from '../services/voiceRecognition';
import { useChatStore } from '../stores/chatStore';
import { Movie } from '../types';

const { width, height } = Dimensions.get('window');

interface VoiceInputModalProps {
    visible: boolean;
    onClose: () => void;
    movie: Movie;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
    visible,
    onClose,
    movie,
}) => {
    const insets = useSafeAreaInsets();
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const baseTranscriptRef = useRef('');
    const { setSelectedMovie, addMessage } = useChatStore();

    // パルスアニメーション
    useEffect(() => {
        if (isListening) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    // モーダルが開いたら自動で音声入力開始
    useEffect(() => {
        if (visible) {
            setTranscript('');
            setError(null);
            baseTranscriptRef.current = '';
            startListening();
        } else {
            stopListening();
        }
    }, [visible]);

    const startListening = useCallback(() => {
        if (!voiceRecognition.isSupported()) {
            setError('このブラウザでは音声入力がサポートされていません');
            return;
        }

        voiceRecognition.start({
            onResult: (text, isFinal) => {
                if (isFinal) {
                    baseTranscriptRef.current += text;
                    setTranscript(baseTranscriptRef.current);
                } else {
                    setTranscript(baseTranscriptRef.current + text);
                }
            },
            onError: (err) => {
                setError(err);
                setIsListening(false);
            },
            onStatusChange: (listening) => {
                setIsListening(listening);
            },
        });
    }, []);

    const stopListening = useCallback(() => {
        voiceRecognition.stop();
        setIsListening(false);
    }, []);

    const handleToggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleComplete = () => {
        stopListening();

        // 映画をセット
        setSelectedMovie({
            id: movie.id,
            title: movie.title,
            posterPath: movie.poster_path || '',
            directors: [],
            releaseDate: movie.release_date,
        });

        // 音声入力のテキストをメッセージとして追加
        if (transcript.trim()) {
            addMessage({
                role: 'user',
                content: transcript.trim(),
            });
        }

        onClose();

        // チャット画面へ遷移
        router.push('/(tabs)/chat');
    };

    const handleCancel = () => {
        stopListening();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    {/* 映画情報 */}
                    <Text style={styles.movieTitle}>{movie.title}</Text>
                    <Text style={styles.subtitle}>について話してください</Text>

                    {/* 音声入力インジケーター */}
                    <View style={styles.micContainer}>
                        <Animated.View
                            style={[
                                styles.micBackground,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: isListening ? 0.3 : 0,
                                },
                            ]}
                        />
                        <TouchableOpacity
                            style={[
                                styles.micButton,
                                isListening && styles.micButtonActive,
                            ]}
                            onPress={handleToggleListening}
                        >
                            <Text style={styles.micIcon}>MIC</Text>
                        </TouchableOpacity>
                        <Text style={styles.listeningText}>
                            {isListening ? '話してください...' : 'タップして音声入力'}
                        </Text>
                    </View>

                    {/* エラー表示 */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    {/* 認識テキスト */}
                    <View style={styles.transcriptContainer}>
                        <Text style={styles.transcriptLabel}>あなたの感想</Text>
                        <Text style={styles.transcript}>
                            {transcript || 'ここに音声が表示されます...'}
                        </Text>
                    </View>

                    {/* ヒント */}
                    <View style={styles.hintsContainer}>
                        <Text style={styles.hintsTitle}>話すヒント</Text>
                        <Text style={styles.hint}>• どのシーンが印象的でしたか？</Text>
                        <Text style={styles.hint}>• どんな気持ちになりましたか？</Text>
                        <Text style={styles.hint}>• 誰かにおすすめしたいですか？</Text>
                    </View>

                    {/* ボタン */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.completeButton,
                                !transcript.trim() && styles.completeButtonDisabled,
                            ]}
                            onPress={handleComplete}
                            disabled={!transcript.trim()}
                        >
                            <Text style={styles.completeButtonText}>
                                AIと会話を続ける
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
    },
    movieTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.primary,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.textMuted,
        marginBottom: 40,
    },
    micContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    micBackground: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.light.accent,
    },
    micButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.light.border,
    },
    micButtonActive: {
        backgroundColor: Colors.light.accent,
        borderColor: Colors.light.accent,
    },
    micIcon: {
        fontSize: 40,
    },
    listeningText: {
        marginTop: 16,
        fontSize: 16,
        color: Colors.light.textMuted,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 14,
        marginBottom: 16,
    },
    transcriptContainer: {
        width: '100%',
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        minHeight: 120,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    transcriptLabel: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    transcript: {
        fontSize: 16,
        color: Colors.light.text,
        lineHeight: 24,
    },
    hintsContainer: {
        width: '100%',
        marginBottom: 32,
    },
    hintsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    hint: {
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
    },
    cancelButtonText: {
        fontSize: 16,
        color: Colors.light.text,
    },
    completeButton: {
        flex: 2,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: Colors.light.accent,
        alignItems: 'center',
    },
    completeButtonDisabled: {
        opacity: 0.5,
    },
    completeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
