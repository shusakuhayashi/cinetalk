import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Image,
    Alert,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useChatStore } from '../../stores/chatStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { chatModel, summarizeModel } from '../../services/gemini';
import { getImageUrl } from '../../services/tmdb';
import { voiceRecognition } from '../../services/voiceRecognition';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';

type ReviewMode = 'chat' | 'direct';

// 感情タグの定義（20種類）
const EMOTION_TAGS = [
    // 感情系
    { id: 'cry', label: '泣けた' },
    { id: 'laugh', label: '笑えた' },
    { id: 'move', label: '感動した' },
    { id: 'warm', label: 'ほっこりした' },
    { id: 'love', label: '恋したくなった' },
    // 刺激系
    { id: 'thrill', label: 'ハラハラした' },
    { id: 'shock', label: '衝撃的だった' },
    { id: 'scary', label: '怖かった' },
    { id: 'tense', label: '緊張した' },
    { id: 'surprise', label: '驚いた' },
    // 思考系
    { id: 'think', label: '考えさせられた' },
    { id: 'deep', label: '深かった' },
    { id: 'message', label: 'メッセージ性があった' },
    { id: 'learn', label: '学びがあった' },
    { id: 'philosophy', label: '哲学的だった' },
    // 感覚系
    { id: 'beauty', label: '美しかった' },
    { id: 'music', label: '音楽が良かった' },
    { id: 'cool', label: 'かっこよかった' },
    { id: 'unique', label: '独特だった' },
    { id: 'masterpiece', label: '名作だった' },
];

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<ReviewMode>('chat');
    const [message, setMessage] = useState('');
    const [directReview, setDirectReview] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [selectedRating, setSelectedRating] = useState(4);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [generatedReview, setGeneratedReview] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const { messages, isLoading, selectedMovie, addMessage, setLoading, clearChat } = useChatStore();
    const { addReview } = useReviewStore();
    const { addRecord } = useCalendarStore();

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // タグ選択の切り替え
    const toggleTag = (tagId: string) => {
        setSelectedTags((prev) =>
            prev.includes(tagId)
                ? prev.filter((id) => id !== tagId)
                : [...prev, tagId]
        );
    };

    // 音声入力用のベーステキスト（useRefでクロージャ問題を回避）
    const baseMessageRef = useRef('');
    const baseDirectReviewRef = useRef('');

    // 音声入力の開始/停止
    const toggleVoiceInput = () => {
        if (!voiceRecognition.isSupported()) {
            Alert.alert(
                '音声入力非対応',
                'このブラウザ/デバイスでは音声入力がサポートされていません\nChromeブラウザをお試しください'
            );
            return;
        }

        if (isRecording) {
            voiceRecognition.stop();
            setIsRecording(false);
        } else {
            // 録音開始時のテキストを保存
            baseMessageRef.current = message;
            voiceRecognition.start({
                onResult: (text, isFinal) => {
                    const newText = baseMessageRef.current + text;
                    setMessage(newText);

                    if (isFinal) {
                        // 最終結果：ベーステキストを更新して次の発話に備える
                        baseMessageRef.current = newText;
                    }
                },
                onError: (error) => {
                    Alert.alert('音声入力エラー', error);
                    setIsRecording(false);
                },
                onStatusChange: (listening) => {
                    setIsRecording(listening);
                },
            });
        }
    };

    // 直接入力モードの音声入力
    const toggleDirectVoiceInput = () => {
        if (!voiceRecognition.isSupported()) {
            Alert.alert(
                '音声入力非対応',
                'このブラウザ/デバイスでは音声入力がサポートされていません\nChromeブラウザをお試しください'
            );
            return;
        }

        if (isRecording) {
            voiceRecognition.stop();
            setIsRecording(false);
        } else {
            // 録音開始時のテキストを保存
            baseDirectReviewRef.current = directReview;
            voiceRecognition.start({
                onResult: (text, isFinal) => {
                    const newText = baseDirectReviewRef.current + text;
                    setDirectReview(newText);

                    if (isFinal) {
                        // 最終結果：ベーステキストを更新して次の発話に備える
                        baseDirectReviewRef.current = newText;
                    }
                },
                onError: (error) => {
                    Alert.alert('音声入力エラー', error);
                    setIsRecording(false);
                },
                onStatusChange: (listening) => {
                    setIsRecording(listening);
                },
            });
        }
    };

    // 選択された映画のコンテキストを構築
    const buildMovieContext = () => {
        if (!selectedMovie) return '';

        return `
【重要：あなたはすでに以下の映画情報を知っています】

■ 映画タイトル: ${selectedMovie.title}（原題: ${selectedMovie.originalTitle}）
■ ジャンル: ${selectedMovie.genres.join('、')}
■ 監督: ${selectedMovie.directors.join('、') || '不明'}
■ 主要キャスト: ${selectedMovie.cast.join('、') || '不明'}
■ 評価: ${selectedMovie.voteAverage.toFixed(1)}/10
■ あらすじ: ${selectedMovie.overview}

【指示】
- 上記の情報はすでに把握済みなので、基本情報を質問しないでください
- ユーザーの「個人的な感想・印象」にフォーカスして質問してください
`;
    };

    // 会話履歴からレビューを要約
    const summarizeReview = async (): Promise<string> => {
        try {
            const conversationText = messages
                .map((m) => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
                .join('\n');

            const result = await summarizeModel.generateContent(
                `以下の会話からユーザーの映画の感想を150文字以内で要約してください：\n\n${conversationText}`
            );
            return result.response.text();
        } catch (error) {
            return '';
        }
    };

    // レビュー・鑑賞記録を保存
    const saveReviewAndRecord = async (reviewText: string) => {
        if (!selectedMovie) return;

        // タグIDからラベルに変換（ReviewTag型にキャスト）
        const tagLabels = selectedTags
            .map((tagId) => EMOTION_TAGS.find((t) => t.id === tagId)?.label)
            .filter((label): label is string => !!label) as import('../../types').ReviewTag[];

        addReview({
            movie_id: selectedMovie.id,
            movie_title: selectedMovie.title,
            rating: selectedRating,
            content: reviewText || '感想を記録しました',
            tags: tagLabels,
            watched_at: new Date().toISOString(),
        });

        const today = new Date().toISOString();
        addRecord({
            movie_id: selectedMovie.id,
            movie_title: selectedMovie.title,
            movie_poster: selectedMovie.posterPath,
            watched_at: today,
        });

        setShowSaveModal(false);
        setSelectedTags([]);
        clearChat();
        router.push(`/movie/${selectedMovie.id}`);
    };

    // チャットからレビュー生成
    const generateReviewFromChat = async () => {
        const review = await summarizeReview();
        setGeneratedReview(review);
        setShowSaveModal(true);
    };

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessage = message.trim();
        setMessage('');

        addMessage({ role: 'user', content: userMessage });
        setLoading(true);

        try {
            const historyFormatted = messages.map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const chat = chatModel.startChat({ history: historyFormatted });

            const context = messages.length === 0 ? buildMovieContext() : '';
            const messageToSend = context
                ? `${context}\n\nユーザー: ${userMessage}`
                : userMessage;

            const result = await chat.sendMessage(messageToSend);
            const text = result.response.text();

            addMessage({ role: 'assistant', content: text });
        } catch (error) {
            console.error('Chat error:', error);
            addMessage({
                role: 'assistant',
                content: '申し訳ありません、エラーが発生しました。',
            });
        } finally {
            setLoading(false);
        }
    };

    const posterUrl = selectedMovie?.posterPath ? getImageUrl(selectedMovie.posterPath, 'w185') : null;

    // ヘッダー右ボタン
    const HeaderRight = () => (
        <TouchableOpacity
            onPress={() => setMode(mode === 'chat' ? 'direct' : 'chat')}
            style={styles.headerButton}
        >
            <Text style={styles.headerButtonText}>
                {mode === 'chat' ? 'WRITE' : 'CHAT'}
            </Text>
        </TouchableOpacity>
    );

    // タグ選択コンポーネント
    const TagSelector = () => (
        <View style={styles.tagContainer}>
            <Text style={styles.tagLabel}>この映画で感じたこと</Text>
            <View style={styles.tagGrid}>
                {EMOTION_TAGS.map((tag) => (
                    <TouchableOpacity
                        key={tag.id}
                        style={[
                            styles.tagButton,
                            selectedTags.includes(tag.id) && styles.tagButtonSelected,
                        ]}
                        onPress={() => toggleTag(tag.id)}
                    >
                        <Text
                            style={[
                                styles.tagButtonText,
                                selectedTags.includes(tag.id) && styles.tagButtonTextSelected,
                            ]}
                        >
                            {tag.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 統一ヘッダー */}
            <StaticHeader title="REVIEW" />

            <KeyboardAvoidingView
                style={[styles.keyboardView, { paddingTop: HEADER_HEIGHT + insets.top }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* 選択中の映画バナー */}
                {selectedMovie && (
                    <View style={styles.movieBanner}>
                        {posterUrl && (
                            <Image source={{ uri: posterUrl }} style={styles.bannerPoster} />
                        )}
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerTitle}>{selectedMovie.title}</Text>
                            <Text style={styles.bannerMeta}>
                                {selectedMovie.directors[0]} • {selectedMovie.releaseDate?.split('-')[0]}
                            </Text>
                        </View>
                    </View>
                )}

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                >
                    {!selectedMovie ? (
                        // 映画未選択時
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>REVIEW</Text>
                            <Text style={styles.welcomeText}>
                                ホーム画面で映画を選び、{'\n'}
                                「レビュー」をタップしてください
                            </Text>
                            <TouchableOpacity
                                style={styles.goHomeButton}
                                onPress={() => router.push('/(tabs)/')}
                            >
                                <Text style={styles.goHomeButtonText}>映画を選ぶ</Text>
                            </TouchableOpacity>
                        </View>
                    ) : mode === 'direct' ? (
                        // 直接入力モード
                        <View style={styles.directInputContainer}>
                            <Text style={styles.directInputTitle}>『{selectedMovie.title}』の感想</Text>

                            <Text style={styles.ratingLabel}>評価</Text>
                            <View style={styles.ratingRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                                        <Text style={styles.ratingStar}>
                                            {star <= selectedRating ? '★' : '☆'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TagSelector />

                            {/* 音声入力ボタン */}
                            <TouchableOpacity
                                style={[styles.voiceInputBtn, isRecording && styles.voiceInputBtnRecording]}
                                onPress={toggleDirectVoiceInput}
                            >
                                <Text style={styles.voiceInputBtnText}>
                                    {isRecording ? 'REC' : 'MIC'}
                                </Text>
                            </TouchableOpacity>

                            <TextInput
                                style={styles.directTextInput}
                                placeholder="感想を入力してください..."
                                placeholderTextColor={Colors.light.textMuted}
                                value={directReview}
                                onChangeText={setDirectReview}
                                multiline
                                maxLength={500}
                            />

                            <TouchableOpacity
                                style={[styles.saveDirectButton, !directReview.trim() && styles.saveDirectButtonDisabled]}
                                onPress={() => saveReviewAndRecord(directReview)}
                                disabled={!directReview.trim()}
                            >
                                <Text style={styles.saveDirectButtonText}>保存する</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // チャットモード
                        <>
                            {messages.length === 0 && (
                                <View style={styles.chatIntroContainer}>
                                    <Text style={styles.chatIntroText}>
                                        どのシーンが印象的でしたか？{'\n'}
                                        どんな気持ちになりましたか？
                                    </Text>
                                </View>
                            )}

                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    style={[
                                        styles.messageBubble,
                                        msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                                    ]}
                                >
                                    {msg.role === 'assistant' && <Text style={styles.aiAvatar}>AI</Text>}
                                    <View
                                        style={[
                                            styles.messageContent,
                                            msg.role === 'user' ? styles.userContent : styles.aiContent,
                                        ]}
                                    >
                                        <Text style={[styles.messageText, msg.role === 'user' && styles.userText]}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            {isLoading && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={Colors.light.primary} />
                                    <Text style={styles.loadingText}>考え中...</Text>
                                </View>
                            )}

                            {/* 一定の会話後にレビュー生成ボタン表示 */}
                            {messages.length >= 4 && (
                                <TouchableOpacity
                                    style={styles.generateButton}
                                    onPress={generateReviewFromChat}
                                >
                                    <Text style={styles.generateButtonText}>レビューを生成する</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* 入力欄（チャットモードの場合のみ表示） */}
                {selectedMovie && mode === 'chat' && (
                    <View style={styles.inputContainer}>
                        {/* マイクボタン */}
                        <TouchableOpacity
                            style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                            onPress={toggleVoiceInput}
                        >
                            <Text style={styles.micBtnText}>{isRecording ? 'REC' : 'MIC'}</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="感想を話してください..."
                            placeholderTextColor={Colors.light.textMuted}
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, (!message.trim() || isLoading) && styles.sendBtnDisabled]}
                            onPress={sendMessage}
                            disabled={!message.trim() || isLoading}
                        >
                            <Text style={styles.sendBtnText}>→</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* レビュー保存モーダル（チャット後） */}
                <Modal visible={showSaveModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>SAVE REVIEW</Text>

                                <Text style={styles.ratingLabel}>評価</Text>
                                <View style={styles.ratingRow}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                                            <Text style={styles.ratingStar}>
                                                {star <= selectedRating ? '★' : '☆'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TagSelector />

                                <Text style={styles.generatedReviewLabel}>生成されたレビュー</Text>
                                <TextInput
                                    style={styles.generatedReviewInput}
                                    value={generatedReview}
                                    onChangeText={setGeneratedReview}
                                    multiline
                                    maxLength={300}
                                />

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={styles.modalCancelBtn}
                                        onPress={() => setShowSaveModal(false)}
                                    >
                                        <Text style={styles.modalCancelText}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalSaveBtn}
                                        onPress={() => saveReviewAndRecord(generatedReview)}
                                    >
                                        <Text style={styles.modalSaveText}>SAVE</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>

                {/* 録音中フローティングオーバーレイ */}
                {isRecording && (
                    <View style={styles.recordingOverlay}>
                        {/* 背景ぼかし */}
                        <View style={styles.recordingBackdrop} />

                        {/* フローティングカード */}
                        <View style={styles.recordingCard}>
                            {/* ミニマルなインジケーター */}
                            <View style={styles.recordingIndicator}>
                                <View style={styles.recordingDot} />
                                <Text style={styles.recordingLabel}>REC</Text>
                            </View>

                            {/* 入力テキスト表示 */}
                            <ScrollView
                                style={styles.recordingTextScroll}
                                contentContainerStyle={styles.recordingTextContent}
                            >
                                <Text style={styles.recordingText}>
                                    {mode === 'chat' ? message : directReview || '...'}
                                </Text>
                            </ScrollView>

                            {/* スタイリッシュな停止ボタン */}
                            <TouchableOpacity
                                style={styles.stopRecordingBtn}
                                onPress={mode === 'chat' ? toggleVoiceInput : toggleDirectVoiceInput}
                            >
                                <View style={styles.stopIcon} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    keyboardView: {
        flex: 1,
    },
    headerButton: {
        marginRight: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.headerText,
    },
    headerButtonText: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
        color: Colors.light.headerText,
    },
    movieBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    bannerPoster: {
        width: 40,
        height: 60,
        borderRadius: 2,
        marginRight: 12,
    },
    bannerInfo: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 2,
    },
    bannerMeta: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 20,
        paddingBottom: 40,
    },
    welcomeContainer: {
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    welcomeTitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    welcomeText: {
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
    goHomeButton: {
        marginTop: 20,
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
    },
    goHomeButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    directInputContainer: {
        padding: 12,
    },
    directInputTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
        textAlign: 'center',
        marginBottom: 24,
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    ratingStar: {
        fontSize: 28,
        color: Colors.light.star,
    },
    tagContainer: {
        marginBottom: 20,
    },
    tagLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    tagButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.border,
        backgroundColor: Colors.light.surface,
    },
    tagButtonSelected: {
        borderColor: Colors.light.primary,
        backgroundColor: Colors.light.primary,
    },
    tagButtonText: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    tagButtonTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    directTextInput: {
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        padding: 16,
        fontSize: 14,
        color: Colors.light.text,
        height: 150,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: 20,
    },
    saveDirectButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
    },
    saveDirectButtonDisabled: {
        opacity: 0.5,
    },
    saveDirectButtonText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
        color: '#FFF',
    },
    chatIntroContainer: {
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    chatIntroText: {
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    userBubble: {
        justifyContent: 'flex-end',
    },
    aiBubble: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.light.textMuted,
        marginRight: 8,
        marginTop: 14,
        letterSpacing: 1,
    },
    messageContent: {
        maxWidth: '80%',
        padding: 14,
        borderRadius: 4,
    },
    userContent: {
        backgroundColor: Colors.light.primary,
        marginLeft: 'auto',
    },
    aiContent: {
        backgroundColor: Colors.light.surface,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.light.text,
    },
    userText: {
        color: '#FFFFFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 36,
    },
    loadingText: {
        marginLeft: 8,
        color: Colors.light.textMuted,
        fontSize: 13,
    },
    generateButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 20,
    },
    generateButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: Colors.light.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.light.background,
        borderRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.light.text,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    sendBtn: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
    },
    sendBtnDisabled: {
        backgroundColor: Colors.light.textMuted,
        opacity: 0.5,
    },
    sendBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        flex: 1,
        width: '100%',
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.light.surface,
        borderRadius: 4,
        padding: 24,
        width: '100%',
        maxWidth: 360,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 2,
        color: Colors.light.primary,
        textAlign: 'center',
        marginBottom: 20,
    },
    generatedReviewLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    generatedReviewInput: {
        backgroundColor: Colors.light.background,
        borderRadius: 4,
        padding: 12,
        fontSize: 13,
        color: Colors.light.text,
        height: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    modalCancelText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        color: Colors.light.textMuted,
    },
    modalSaveBtn: {
        flex: 1,
        backgroundColor: Colors.light.primary,
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1,
        color: '#FFF',
    },
    // 音声入力ボタン（チャットモード）
    micBtn: {
        backgroundColor: Colors.light.surface,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    micBtnRecording: {
        backgroundColor: '#FF4444',
        borderColor: '#FF4444',
    },
    micBtnText: {
        fontSize: 16,
    },
    // 音声入力ボタン（直接入力モード）
    voiceInputBtn: {
        backgroundColor: Colors.light.surface,
        paddingVertical: 14,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
    },
    voiceInputBtnRecording: {
        backgroundColor: '#FF4444',
        borderColor: '#FF4444',
        borderStyle: 'solid',
    },
    voiceInputBtnText: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    // 録音中オーバーレイ
    recordingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    recordingBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    recordingCard: {
        backgroundColor: Colors.light.surface,
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: Colors.light.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        marginRight: 8,
    },
    recordingLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FF3B30',
        letterSpacing: 2,
    },
    recordingTextScroll: {
        maxHeight: 200,
        marginBottom: 20,
    },
    recordingTextContent: {
        paddingVertical: 4,
    },
    recordingText: {
        fontSize: 17,
        lineHeight: 28,
        color: Colors.light.text,
        textAlign: 'center',
    },
    stopRecordingBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.primary,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    stopIcon: {
        width: 14,
        height: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 2,
    },
});
