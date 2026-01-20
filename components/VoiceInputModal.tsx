import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { voiceRecognition } from '../services/voiceRecognition';
import { chatModel, summarizeModel } from '../services/gemini';
import { useReviewStore } from '../stores/reviewStore';
import { useCalendarStore } from '../stores/calendarStore';
import { Movie, ReviewTag } from '../types';
import { getImageUrl, getMovieReviews, sortReviewsByLanguage, TMDbReview } from '../services/tmdb';
import { StaticHeader, HEADER_HEIGHT } from './AnimatedHeader';
import { FooterTabBar } from './FooterTabBar';

const { width, height } = Dimensions.get('window');

// 音声インジケータースタイル
type IndicatorStyle = 'pulse' | 'wave' | 'ring' | 'dots' | 'bar' | 'popcorn';

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
    const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>('pulse');
    const [showMovieInfo, setShowMovieInfo] = useState(false);

    // チャット関連の状態
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string; }[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedRating, setSelectedRating] = useState(4);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    // 連続会話モード
    const [autoChatMode, setAutoChatMode] = useState(true); // デフォルトでオン
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingTranscriptRef = useRef('');

    // TMDbレビュー
    const [otherReviews, setOtherReviews] = useState<TMDbReview[]>([]);

    // アニメーション
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(0.3))).current;
    const ringAnim = useRef(new Animated.Value(0)).current;
    const dotAnims = useRef([...Array(3)].map(() => new Animated.Value(0))).current;
    const barAnim = useRef(new Animated.Value(0)).current;
    // ポップコーンアニメーション（8つのカーネル）
    const popcornAnims = useRef([...Array(8)].map(() => ({
        y: new Animated.Value(0),
        x: new Animated.Value(0),
        scale: new Animated.Value(0),
        rotate: new Animated.Value(0),
    }))).current;

    const baseTranscriptRef = useRef('');
    const { addReview } = useReviewStore();
    const { addRecord } = useCalendarStore();

    // 感情タグの定義
    const EMOTION_TAGS = [
        { id: 'cry', label: '泣けた' },
        { id: 'laugh', label: '笑えた' },
        { id: 'move', label: '感動した' },
        { id: 'thrill', label: 'ハラハラした' },
        { id: 'think', label: '考えさせられた' },
        { id: 'beauty', label: '美しかった' },
        { id: 'music', label: '音楽が良かった' },
        { id: 'masterpiece', label: '名作だった' },
    ];

    // アニメーション制御
    useEffect(() => {
        if (isListening) {
            // パルスアニメーション
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );
            pulse.start();

            // 波形アニメーション
            const waveAnimations = waveAnims.map((anim, i) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(i * 100),
                        Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: false }),
                        Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: false }),
                    ])
                )
            );
            waveAnimations.forEach(a => a.start());

            // リングアニメーション
            const ring = Animated.loop(
                Animated.sequence([
                    Animated.timing(ringAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                    Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
                ])
            );
            ring.start();

            // ドットアニメーション
            const dotAnimations = dotAnims.map((anim, i) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(i * 200),
                        Animated.timing(anim, { toValue: -8, duration: 300, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ])
                )
            );
            dotAnimations.forEach(a => a.start());

            // バーアニメーション
            const bar = Animated.loop(
                Animated.sequence([
                    Animated.timing(barAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                    Animated.timing(barAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
                ])
            );
            bar.start();

            // ポップコーンアニメーション
            const popcornAnimations = popcornAnims.map((anim, i) => {
                const delay = i * 150;
                const angle = (i / 8) * Math.PI * 2;
                const distance = 25 + Math.random() * 15;
                const targetX = Math.cos(angle) * distance;
                const targetY = -20 - Math.random() * 20;

                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.parallel([
                            Animated.timing(anim.y, { toValue: targetY, duration: 400, useNativeDriver: true }),
                            Animated.timing(anim.x, { toValue: targetX, duration: 400, useNativeDriver: true }),
                            Animated.timing(anim.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
                            Animated.timing(anim.rotate, { toValue: 1, duration: 400, useNativeDriver: true }),
                        ]),
                        Animated.parallel([
                            Animated.timing(anim.y, { toValue: 0, duration: 300, useNativeDriver: true }),
                            Animated.timing(anim.x, { toValue: 0, duration: 300, useNativeDriver: true }),
                            Animated.timing(anim.scale, { toValue: 0, duration: 200, useNativeDriver: true }),
                            Animated.timing(anim.rotate, { toValue: 0, duration: 300, useNativeDriver: true }),
                        ]),
                        Animated.delay(400),
                    ])
                );
            });
            popcornAnimations.forEach(a => a.start());

            return () => {
                pulse.stop();
                waveAnimations.forEach(a => a.stop());
                ring.stop();
                dotAnimations.forEach(a => a.stop());
                bar.stop();
                popcornAnimations.forEach(a => a.stop());
            };
        } else {
            pulseAnim.setValue(1);
            waveAnims.forEach(a => a.setValue(0.3));
            ringAnim.setValue(0);
            dotAnims.forEach(a => a.setValue(0));
            barAnim.setValue(0);
            popcornAnims.forEach(a => {
                a.y.setValue(0);
                a.x.setValue(0);
                a.scale.setValue(0);
                a.rotate.setValue(0);
            });
        }
    }, [isListening]);

    useEffect(() => {
        if (visible) {
            setTranscript('');
            setError(null);
            baseTranscriptRef.current = '';
            // 音声入力は自動開始しない（マイクボタンで開始）

            // TMDbレビューを読み込む（詳しいレビューを優先）
            const loadReviews = async () => {
                try {
                    // 複数ページ取得して20件集める
                    let allReviews: TMDbReview[] = [];
                    for (let page = 1; page <= 3 && allReviews.length < 30; page++) {
                        const reviewsData = await getMovieReviews(movie.id, page);
                        if (reviewsData.results) {
                            allReviews = [...allReviews, ...reviewsData.results];
                        }
                        if (page >= reviewsData.total_pages) break;
                    }

                    // 日本語優先でソート
                    const sorted = sortReviewsByLanguage(allReviews);

                    // 詳しいレビュー（内容が長い）を優先してソート
                    const detailedFirst = sorted.sort((a, b) => {
                        // 日本語を最優先
                        if (a.iso_639_1 === 'ja' && b.iso_639_1 !== 'ja') return -1;
                        if (a.iso_639_1 !== 'ja' && b.iso_639_1 === 'ja') return 1;
                        // 同じ言語なら長さでソート（詳しいレビュー優先）
                        return b.content.length - a.content.length;
                    });

                    setOtherReviews(detailedFirst.slice(0, 20)); // 最大20件
                } catch (e) {
                    console.log('Reviews fetch error:', e);
                }
            };
            loadReviews();
        } else {
            stopListening();
        }
    }, [visible]);

    // チャットメッセージが追加されたら自動スクロール
    useEffect(() => {
        if (chatMessages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
        }
    }, [chatMessages]);

    const startListening = useCallback(() => {
        if (!voiceRecognition.isSupported()) {
            setError('このブラウザでは音声入力がサポートされていません');
            return;
        }

        // タイマーをクリア
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        voiceRecognition.start({
            onResult: (text, isFinal) => {
                // 新しい発話があればタイマーをリセット
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }

                if (isFinal) {
                    baseTranscriptRef.current += text;
                    setTranscript(baseTranscriptRef.current);
                    pendingTranscriptRef.current = baseTranscriptRef.current;

                    // 連続会話モードの場合、無音タイマーを開始
                    if (autoChatMode && baseTranscriptRef.current.trim()) {
                        silenceTimerRef.current = setTimeout(() => {
                            // 1.5秒の無音後に自動送信
                            if (pendingTranscriptRef.current.trim()) {
                                autoSendMessage();
                            }
                        }, 1500);
                    }
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
    }, [autoChatMode]);

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

    // 映画コンテキストを構築
    const buildMovieContext = () => {
        // 他人のレビューを要約
        let reviewsSummary = '';
        if (otherReviews.length > 0) {
            const reviewTexts = otherReviews.map((r, i) => {
                // レビュー内容を短く切り詰め（最大200文字）
                const content = r.content.length > 200 ? r.content.substring(0, 200) + '...' : r.content;
                const rating = r.author_details.rating ? `(${r.author_details.rating}/10)` : '';
                return `${i + 1}. ${r.author}さん${rating}: ${content}`;
            });
            reviewsSummary = `
【他の視聴者の感想（参考情報）】
${reviewTexts.join('\n')}
`;
        }

        return `
【重要：あなたはすでに以下の映画情報を知っています】
■ 映画タイトル: ${movie.title}（原題: ${movie.original_title}）
■ 評価: ${movie.vote_average?.toFixed(1) || 'N/A'}/10
■ あらすじ: ${movie.overview || ''}
${reviewsSummary}
【指示】
- 上記の情報はすでに把握済みなので、基本情報を質問しないでください
- ユーザーの「個人的な感想・印象」にフォーカスして質問してください
- 他の視聴者の感想を参考に、「他の人はこう感じていたみたいですね」のように会話を広げてOKです
- 1回の返信は2-3文で簡潔に`;
    };

    // メッセージ送信（AI会話をモーダル内で完結）
    const sendMessage = async (autoMode = false) => {
        const messageToUse = autoMode ? pendingTranscriptRef.current : transcript;
        if (!messageToUse.trim() || isLoadingAI) return;

        // タイマーをクリア
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        stopListening();
        const userMessage = messageToUse.trim();

        // ユーザーメッセージを追加（関数型更新で最新のstateを参照）
        setChatMessages(prev => [...prev, { role: 'user' as const, content: userMessage }]);
        setTranscript('');
        baseTranscriptRef.current = '';
        pendingTranscriptRef.current = '';
        setIsLoadingAI(true);

        try {
            // 現在のchatMessagesをrefで保持してAPIに渡す
            const currentMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];

            const historyFormatted = currentMessages.slice(0, -1).map((m) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            }));

            const chat = chatModel.startChat({ history: historyFormatted });

            const context = currentMessages.length === 1 ? buildMovieContext() : '';
            const messageToSend = context
                ? `${context}\n\nユーザー: ${userMessage}`
                : userMessage;

            const result = await chat.sendMessage(messageToSend);
            const aiResponse = result.response.text();

            // AI応答を追加（関数型更新）
            setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);

            // スクロールを最下部へ
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);

            // 連続会話モードの場合、AI応答後に自動でリスニング再開
            if (autoChatMode) {
                setTimeout(() => {
                    startListening();
                }, 500); // 少し待ってから再開
            }
        } catch (err) {
            console.error('Chat error:', err);
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' }]);
        } finally {
            setIsLoadingAI(false);
        }
    };

    // 自動送信（無音検出後に呼ばれる）
    const autoSendMessage = () => {
        sendMessage(true);
    };

    // レビュー保存
    const [isSavingReview, setIsSavingReview] = useState(false);

    const saveReview = async () => {
        if (isSavingReview) return;
        setIsSavingReview(true);

        try {
            // 会話履歴をフォーマット
            const conversationText = chatMessages
                .map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
                .join('\n\n');

            // AIに要約させてブログ風レビューを生成
            const prompt = `以下の会話履歴から、ユーザーの感想を整理して映画レビューを作成してください。

【映画情報】
タイトル: ${movie.title}
評価: ${selectedRating}/5

【会話履歴】
${conversationText}

【絶対に守るルール】
- ユーザーが実際に言った内容だけを使用してください
- ユーザーが言っていないことを追加・想像しないでください
- AIの発言内容はレビューに含めないでください
- 内容を盛ったり誇張したりしないでください
- ユーザーが言った具体的な言葉（「社会の歪み」「ラストのオチ」等）をそのまま使ってください

【レビューの構成】
1. キャッチーな一言紹介（1文）- ユーザーの感想から最も印象的な部分を抜粋
2. 会話で言及されたポイント（会話に出た内容のみ）
   - ストーリー・展開について（言及があれば）
   - 印象的なシーンや演出（言及があれば）
   - キャラクターや俳優について（言及があれば）
   - 音楽・映像・カメラワークについて（言及があれば）
   - テーマやメッセージ（言及があれば）
3. おすすめ度（言及があれば）

【形式】
- 300-400文字程度
- 「〜でした」「〜と思いました」のような一人称視点で
- 絶対に日本語のみで書いてください
- 会話に出ていないセクションは省略してOK`;

            const result = await summarizeModel.generateContent(prompt);
            const reviewText = result.response.text().trim();

            // タグIDからラベルに変換
            const tagLabels = selectedTags
                .map(tagId => EMOTION_TAGS.find(t => t.id === tagId)?.label)
                .filter((label): label is string => !!label) as ReviewTag[];

            addReview({
                movie_id: movie.id,
                movie_title: movie.title,
                rating: selectedRating,
                content: reviewText || '素晴らしい映画でした！',
                tags: tagLabels,
                watched_at: new Date().toISOString(),
            });

            addRecord({
                movie_id: movie.id,
                movie_title: movie.title,
                movie_poster: movie.poster_path || '',
                watched_at: new Date().toISOString(),
            });

            // リセットして閉じる
            setChatMessages([]);
            setSelectedTags([]);
            setShowReviewForm(false);
            onClose();
        } catch (error) {
            console.error('Review generation error:', error);
            // エラー時は会話をそのまま保存
            const userMessages = chatMessages.filter(m => m.role === 'user');
            const fallbackContent = userMessages.map(m => m.content).join(' ');

            const tagLabels = selectedTags
                .map(tagId => EMOTION_TAGS.find(t => t.id === tagId)?.label)
                .filter((label): label is string => !!label) as ReviewTag[];

            addReview({
                movie_id: movie.id,
                movie_title: movie.title,
                rating: selectedRating,
                content: fallbackContent || '鑑賞しました',
                tags: tagLabels,
                watched_at: new Date().toISOString(),
            });

            addRecord({
                movie_id: movie.id,
                movie_title: movie.title,
                movie_poster: movie.poster_path || '',
                watched_at: new Date().toISOString(),
            });

            setChatMessages([]);
            setSelectedTags([]);
            setShowReviewForm(false);
            onClose();
        } finally {
            setIsSavingReview(false);
        }
    };

    // タグ選択の切り替え
    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const handleCancel = () => {
        stopListening();
        setChatMessages([]);
        setShowReviewForm(false);
        onClose();
    };

    // 音声インジケーターのレンダリング
    const renderVoiceIndicator = () => {
        if (!isListening) {
            // 待機状態 - シンプルなマイクアイコン
            return (
                <View style={styles.micIconStatic}>
                    <View style={styles.micHead} />
                    <View style={styles.micStand} />
                    <View style={styles.micBase} />
                </View>
            );
        }

        switch (indicatorStyle) {
            case 'pulse':
                // パルス - シンプルな拡大縮小
                return (
                    <View style={styles.indicatorContainer}>
                        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                        <View style={styles.micIconActive}>
                            <View style={[styles.micHead, styles.micHeadActive]} />
                            <View style={[styles.micStand, styles.micStandActive]} />
                            <View style={[styles.micBase, styles.micBaseActive]} />
                        </View>
                    </View>
                );

            case 'wave':
                // 波形 - 音声波形バー
                return (
                    <View style={styles.waveContainer}>
                        {waveAnims.map((anim, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.waveBar,
                                    {
                                        height: anim.interpolate({
                                            inputRange: [0.3, 1],
                                            outputRange: [12, 36],
                                        }),
                                    },
                                ]}
                            />
                        ))}
                    </View>
                );

            case 'ring':
                // リング - 波紋エフェクト
                return (
                    <View style={styles.indicatorContainer}>
                        <Animated.View
                            style={[
                                styles.ringCircle,
                                {
                                    transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
                                    opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.ringCircle,
                                {
                                    transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] }) }],
                                    opacity: 0.8,
                                },
                            ]}
                        />
                        <View style={styles.micIconActive}>
                            <View style={[styles.micHead, styles.micHeadActive]} />
                            <View style={[styles.micStand, styles.micStandActive]} />
                            <View style={[styles.micBase, styles.micBaseActive]} />
                        </View>
                    </View>
                );

            case 'dots':
                // ドット - 3つの跳ねるドット
                return (
                    <View style={styles.dotsContainer}>
                        {dotAnims.map((anim, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    { transform: [{ translateY: anim }] },
                                ]}
                            />
                        ))}
                    </View>
                );

            case 'bar':
                // バー - プログレスバー風
                return (
                    <View style={styles.barContainer}>
                        <View style={styles.barTrack}>
                            <Animated.View
                                style={[
                                    styles.barFill,
                                    {
                                        width: barAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: ['20%', '80%', '20%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.barText}>録音中...</Text>
                    </View>
                );

            case 'popcorn':
                // ポップコーン - 弾けるロゴスタイルポップコーン
                return (
                    <View style={styles.popcornContainer}>
                        {/* マイクアイコン（バケツの代わり） */}
                        <View style={styles.popcornMicIcon}>
                            <View style={styles.popcornMicHead} />
                            <View style={styles.popcornMicStand} />
                        </View>
                        {/* 弾けるモコモコポップコーン */}
                        {popcornAnims.map((anim, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.popcornKernel,
                                    {
                                        transform: [
                                            { translateY: anim.y },
                                            { translateX: anim.x },
                                            { scale: anim.scale },
                                            {
                                                rotate: anim.rotate.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0deg', '180deg'],
                                                })
                                            },
                                        ],
                                    },
                                ]}
                            >
                                {/* ロゴスタイルのモコモコ形状 */}
                                <View style={styles.cloudPopcorn}>
                                    <View style={styles.cloudCircle1} />
                                    <View style={styles.cloudCircle2} />
                                    <View style={styles.cloudCircle3} />
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                );
        }
    };

    const posterUri = getImageUrl(movie.poster_path, 'w342');
    const backdropUri = getImageUrl(movie.backdrop_path, 'w780');

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                {/* 固定ヘッダー（ロゴ + REVIEW）*/}
                <View style={[styles.modalHeader, { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top }]}>
                    <View style={styles.modalHeaderContent}>
                        {/* ロゴ（左）- タップで戻る */}
                        <TouchableOpacity onPress={handleCancel} style={styles.logoButton}>
                            <Image
                                source={require('../assets/logo-cloud-camera.png')}
                                style={styles.modalHeaderLogo}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                        <Text style={styles.modalHeaderTitle}>REVIEW</Text>
                        {/* プロフィールアイコン（右）- 他ページと統一 */}
                        <View style={styles.profileIcon}>
                            <View style={styles.profileHead} />
                            <View style={styles.profileBody} />
                        </View>
                    </View>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollContainer}
                    contentContainerStyle={[styles.container, { paddingTop: HEADER_HEIGHT + insets.top }]}
                    bounces={false}
                >
                    {/* バックドロップ画像 */}
                    <View style={styles.backdropContainer}>
                        {backdropUri ? (
                            <Image source={{ uri: backdropUri }} style={styles.backdrop} />
                        ) : (
                            <View style={[styles.backdrop, styles.backdropPlaceholder]} />
                        )}
                        <View style={styles.backdropOverlay} />
                    </View>

                    {/* メイン情報 */}
                    <View style={styles.mainInfo}>
                        <View style={styles.posterContainer}>
                            {posterUri ? (
                                <Image source={{ uri: posterUri }} style={styles.poster} />
                            ) : (
                                <View style={[styles.poster, styles.posterPlaceholder]}>
                                    <Text style={styles.posterPlaceholderText}>MOVIE</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{movie.title}</Text>
                            {movie.original_title && movie.original_title !== movie.title && (
                                <Text style={styles.originalTitle}>{movie.original_title}</Text>
                            )}
                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>
                                    {movie.release_date?.split('-')[0]} • {movie.runtime ? `${movie.runtime}分` : ''}
                                </Text>
                            </View>
                            <View style={styles.ratingContainer}>
                                <Text style={styles.ratingText}>★ {movie.vote_average?.toFixed(1) || 'N/A'}</Text>
                                {movie.vote_count && (
                                    <Text style={styles.voteCount}>({movie.vote_count} reviews)</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* エラー表示 */}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* 映画情報トグル */}
                    {!showReviewForm && (
                        <TouchableOpacity
                            style={styles.movieInfoToggle}
                            onPress={() => setShowMovieInfo(!showMovieInfo)}
                        >
                            <Text style={styles.movieInfoToggleText}>
                                {showMovieInfo ? '映画情報を隠す ▲' : '映画情報を見る ▼'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* 映画詳細情報 */}
                    {showMovieInfo && !showReviewForm && (
                        <View style={styles.movieInfoSection}>
                            {/* あらすじ */}
                            <View style={styles.infoBlock}>
                                <Text style={styles.infoLabel}>あらすじ</Text>
                                <Text style={styles.infoText}>
                                    {movie.overview || '情報がありません'}
                                </Text>
                            </View>

                            {/* ジャンル */}
                            {movie.genres && movie.genres.length > 0 && (
                                <View style={styles.infoBlock}>
                                    <Text style={styles.infoLabel}>ジャンル</Text>
                                    <View style={styles.genreRow}>
                                        {movie.genres.map((genre) => (
                                            <View key={genre.id} style={styles.genreBadge}>
                                                <Text style={styles.genreText}>{genre.name}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* 認識テキスト/チャット表示エリア */}
                    <View style={styles.transcriptContainer}>
                        {chatMessages.length === 0 ? (
                            <>
                                <Text style={styles.transcriptLabel}>あなたの感想</Text>
                                <TextInput
                                    style={styles.transcriptInput}
                                    placeholder="話すか、ここに入力..."
                                    placeholderTextColor={Colors.light.textMuted}
                                    value={transcript}
                                    onChangeText={(text) => {
                                        setTranscript(text);
                                        baseTranscriptRef.current = text;
                                    }}
                                    multiline
                                    maxLength={300}
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.transcriptLabel}>会話</Text>
                                {chatMessages.map((msg, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.chatBubble,
                                            msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                                        ]}
                                    >
                                        {msg.role === 'assistant' && (
                                            <Text style={styles.aiLabel}>AI</Text>
                                        )}
                                        <Text style={[
                                            styles.chatText,
                                            msg.role === 'user' && styles.userChatText,
                                        ]}>
                                            {msg.content}
                                        </Text>
                                    </View>
                                ))}
                                {isLoadingAI && (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={Colors.light.primary} />
                                        <Text style={styles.loadingText}>考え中...</Text>
                                    </View>
                                )}
                                {/* 続きの入力 */}
                                <TextInput
                                    style={styles.continueInput}
                                    placeholder="続きを話す..."
                                    placeholderTextColor={Colors.light.textMuted}
                                    value={transcript}
                                    onChangeText={(text) => {
                                        setTranscript(text);
                                        baseTranscriptRef.current = text;
                                    }}
                                    multiline
                                    maxLength={300}
                                />
                            </>
                        )}
                    </View>

                    {/* レビュー保存フォーム */}
                    {showReviewForm && (
                        <View style={styles.reviewFormContainer}>
                            <Text style={styles.reviewFormTitle}>レビューを保存</Text>

                            {/* 評価 */}
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

                            {/* タグ選択 */}
                            <Text style={styles.tagSectionLabel}>感じたこと</Text>
                            <View style={styles.tagContainer}>
                                {EMOTION_TAGS.map((tag) => (
                                    <TouchableOpacity
                                        key={tag.id}
                                        style={[
                                            styles.tagButton,
                                            selectedTags.includes(tag.id) && styles.tagButtonSelected,
                                        ]}
                                        onPress={() => toggleTag(tag.id)}
                                    >
                                        <Text style={[
                                            styles.tagButtonText,
                                            selectedTags.includes(tag.id) && styles.tagButtonTextSelected,
                                        ]}>
                                            {tag.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.saveReviewButton, isSavingReview && styles.saveReviewButtonDisabled]}
                                onPress={saveReview}
                                disabled={isSavingReview}
                            >
                                {isSavingReview ? (
                                    <View style={styles.savingContainer}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.saveReviewButtonText}>レビュー生成中...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.saveReviewButtonText}>レビューを保存</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ヒント */}
                    {!showReviewForm && chatMessages.length === 0 && (
                        <View style={styles.hintsContainer}>
                            <Text style={styles.hintsTitle}>話すヒント</Text>
                            <Text style={styles.hint}>• どのシーンが印象的でしたか？</Text>
                            <Text style={styles.hint}>• どんな気持ちになりましたか？</Text>
                            <Text style={styles.hint}>• 誰かにおすすめしたいですか？</Text>
                        </View>
                    )}

                    {/* ボタン */}
                    {!showReviewForm && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                                <Text style={styles.cancelButtonText}>キャンセル</Text>
                            </TouchableOpacity>

                            {chatMessages.length >= 2 ? (
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => setShowReviewForm(true)}
                                >
                                    <Text style={styles.completeButtonText}>レビュー保存</Text>
                                </TouchableOpacity>
                            ) : autoChatMode ? (
                                // 連続会話モード：自動送信なので手動送信ボタン不要
                                <View style={styles.autoChatIndicator}>
                                    <Text style={styles.autoChatText}>
                                        {isListening ? '🎤 話してください' : isLoadingAI ? '💭 AI考え中...' : '🎤 会話中'}
                                    </Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.completeButton, (!transcript.trim() || isLoadingAI) && styles.completeButtonDisabled]}
                                    onPress={() => sendMessage(false)}
                                    disabled={!transcript.trim() || isLoadingAI}
                                >
                                    <Text style={styles.completeButtonText}>
                                        {isLoadingAI ? '...' : '送信'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* インジケータースタイル選択 */}
                    <View style={styles.indicatorSelectorContainer}>
                        <Text style={styles.indicatorSelectorLabel}>音声インジケーター選択</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicatorSelector}>
                            {(['pulse', 'wave', 'ring', 'dots', 'bar', 'popcorn'] as IndicatorStyle[]).map((style) => (
                                <TouchableOpacity
                                    key={style}
                                    style={[
                                        styles.indicatorButton,
                                        indicatorStyle === style && styles.indicatorButtonActive,
                                    ]}
                                    onPress={() => setIndicatorStyle(style)}
                                >
                                    <Text style={[
                                        styles.indicatorButtonText,
                                        indicatorStyle === style && styles.indicatorButtonTextActive,
                                    ]}>
                                        {style === 'pulse' ? 'パルス' :
                                            style === 'wave' ? '波形' :
                                                style === 'ring' ? 'リング' :
                                                    style === 'dots' ? 'ドット' :
                                                        style === 'bar' ? 'バー' : '🍿'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>

                {/* フローティングマイクボタン（右下固定） */}
                {!showReviewForm && (
                    <TouchableOpacity
                        style={[
                            styles.floatingMicButton,
                            isListening && styles.floatingMicButtonActive,
                        ]}
                        onPress={handleToggleListening}
                    >
                        <Animated.View
                            style={[
                                styles.floatingMicContent,
                                isListening && { transform: [{ scale: pulseAnim }] }
                            ]}
                        >
                            {/* CSSで描いたマイクアイコン */}
                            <View style={[styles.micIconBody, isListening && styles.micIconBodyActive]} />
                            <View style={[styles.micIconStand, isListening && styles.micIconStandActive]} />
                            <View style={[styles.micIconBase, isListening && styles.micIconBaseActive]} />
                        </Animated.View>
                        {isListening && (
                            <Text style={styles.floatingMicLabel}>話してください</Text>
                        )}
                    </TouchableOpacity>
                )}

                {/* フッタータブバー */}
                <FooterTabBar />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    backdropImage: {
        width: '100%',
        height: '100%',
    },
    scrollContainer: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // 固定ヘッダー
    // モーダルヘッダー（ホームページと同じスタイル）
    modalHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.light.headerBg,
        zIndex: 1000,
    },
    modalHeaderContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoButton: {
        marginLeft: 16,
        marginRight: 12,
    },
    modalHeaderLogo: {
        width: 28,
        height: 28,
    },
    modalHeaderTitle: {
        flex: 1,
        fontWeight: '600',
        fontSize: 16,
        letterSpacing: 2,
        color: Colors.light.headerText,
        textAlign: 'center',
    },
    profileIcon: {
        marginRight: 16,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileHead: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.light.headerText,
        backgroundColor: 'transparent',
        marginBottom: 2,
    },
    profileBody: {
        width: 16,
        height: 7,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 1.5,
        borderBottomWidth: 0,
        borderColor: Colors.light.headerText,
        backgroundColor: 'transparent',
    },
    closeHeaderButton: {
        marginRight: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeHeaderIcon: {
        fontSize: 20,
        color: Colors.light.headerText,
        fontWeight: '400',
    },
    backButton: {
        marginLeft: 8,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 32,
        color: Colors.light.headerText,
        fontWeight: '300',
    },
    profileIcon: {
        marginRight: 16,
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileHead: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: Colors.light.headerText,
        backgroundColor: 'transparent',
        marginBottom: 2,
    },
    profileBody: {
        width: 16,
        height: 7,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 1.5,
        borderBottomWidth: 0,
        borderColor: Colors.light.headerText,
        backgroundColor: 'transparent',
    },
    header: {
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 20,
        color: '#666',
        fontWeight: '400',
    },

    // バックドロップコンテナ（映画詳細ページと同じ）
    backdropContainer: {
        height: 250,
        position: 'relative',
        marginHorizontal: -20,
        marginTop: 0,
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    backdropPlaceholder: {
        backgroundColor: Colors.light.primary,
    },
    backdropOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },

    // メイン情報（映画詳細ページと同じ）
    mainInfo: {
        flexDirection: 'row',
        padding: 20,
        marginTop: -60,
        alignItems: 'flex-start',
    },
    posterContainer: {
        width: 120,
        height: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderRadius: 12,
        overflow: 'hidden',
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 12,
    },
    posterPlaceholder: {
        backgroundColor: Colors.light.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterPlaceholderText: {
        fontSize: 40,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 16,
        paddingTop: 70,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    originalTitle: {
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    metaRow: {
        marginBottom: 8,
    },
    metaText: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFD700',
    },
    voteCount: {
        fontSize: 12,
        color: Colors.light.textMuted,
        marginLeft: 6,
    },

    // 音声入力エリア
    voiceArea: {
        alignItems: 'center',
        marginBottom: 20,
    },
    micButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    micButtonActive: {
        backgroundColor: '#1a1a1a',
        borderColor: '#1a1a1a',
    },
    listeningText: {
        marginTop: 12,
        fontSize: 14,
        color: '#888',
    },

    // マイクアイコン（静的）
    micIconStatic: {
        alignItems: 'center',
    },
    micIconActive: {
        alignItems: 'center',
        zIndex: 1,
    },
    micHead: {
        width: 16,
        height: 24,
        borderWidth: 2,
        borderColor: '#333',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    micHeadActive: {
        borderColor: '#fff',
    },
    micStand: {
        width: 2,
        height: 8,
        backgroundColor: '#333',
        marginTop: 2,
    },
    micStandActive: {
        backgroundColor: '#fff',
    },
    micBase: {
        width: 16,
        height: 2,
        backgroundColor: '#333',
        borderRadius: 1,
    },
    micBaseActive: {
        backgroundColor: '#fff',
    },

    // インジケーター共通
    indicatorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    // パルス
    pulseCircle: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },

    // 波形
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        height: 40,
    },
    waveBar: {
        width: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
    },

    // リング
    ringCircle: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#fff',
    },

    // ドット
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 40,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },

    // バー
    barContainer: {
        alignItems: 'center',
        width: '100%',
    },
    barTrack: {
        width: 50,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    barText: {
        marginTop: 6,
        fontSize: 10,
        color: '#fff',
    },

    // ポップコーン
    popcornContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        height: 70,
    },
    popcornMicIcon: {
        alignItems: 'center',
        position: 'absolute',
        bottom: 5,
    },
    popcornMicHead: {
        width: 12,
        height: 18,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    popcornMicStand: {
        width: 2,
        height: 6,
        backgroundColor: '#fff',
        marginTop: 2,
    },
    popcornKernel: {
        position: 'absolute',
        top: 5,
    },
    // ロゴスタイルのモコモコ雲形状
    cloudPopcorn: {
        width: 20,
        height: 14,
        position: 'relative',
    },
    cloudCircle1: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        left: 0,
        bottom: 0,
    },
    cloudCircle2: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        left: 4,
        top: 0,
    },
    cloudCircle3: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        right: 0,
        bottom: 0,
    },


    // エラー
    errorText: {
        color: '#ff6b6b',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 12,
    },

    // 認識テキスト
    transcriptContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        minHeight: 80,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    transcriptLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 8,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    transcript: {
        fontSize: 15,
        color: '#1a1a1a',
        lineHeight: 22,
    },
    transcriptInput: {
        fontSize: 15,
        color: '#1a1a1a',
        lineHeight: 22,
        minHeight: 60,
        textAlignVertical: 'top',
    },

    // チャット表示
    chatBubble: {
        marginBottom: 12,
        maxWidth: '85%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.light.primary,
        padding: 12,
        borderRadius: 12,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 12,
        borderBottomLeftRadius: 4,
    },
    aiLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#888',
        marginBottom: 4,
    },
    chatText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    userChatText: {
        color: '#fff',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#888',
    },
    continueInput: {
        marginTop: 12,
        fontSize: 14,
        color: '#1a1a1a',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        minHeight: 44,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },

    // レビューフォーム
    reviewFormContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    reviewFormTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 20,
    },
    ratingLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textAlign: 'center',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    ratingStar: {
        fontSize: 28,
        color: '#f5a623',
    },
    tagSectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textAlign: 'center',
        marginBottom: 12,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 20,
    },
    tagButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        backgroundColor: '#fff',
    },
    tagButtonSelected: {
        borderColor: Colors.light.primary,
        backgroundColor: Colors.light.primary,
    },
    tagButtonText: {
        fontSize: 12,
        color: '#666',
    },
    tagButtonTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    saveReviewButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveReviewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    saveReviewButtonDisabled: {
        opacity: 0.7,
    },
    savingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },


    // 映画情報トグル
    movieInfoToggle: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    movieInfoToggleText: {
        fontSize: 13,
        color: '#666',
    },

    // 映画情報セクション
    movieInfoSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    infoBlock: {
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 6,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 20,
    },
    genreRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    genreBadge: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    genreText: {
        fontSize: 12,
        color: '#666',
    },

    // ヒント
    hintsContainer: {
        marginBottom: 20,
    },
    hintsTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        marginBottom: 8,
    },
    hint: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },

    // ボタン
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        color: '#666',
        fontWeight: '500',
    },
    completeButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
    },
    completeButtonDisabled: {
        opacity: 0.4,
    },
    completeButtonText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '600',
    },
    autoChatIndicator: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    autoChatText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },

    // フローティングマイクボタン
    floatingMicButton: {
        position: 'absolute',
        bottom: 100, // 下部ボタンと被らない位置
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 100,
    },
    floatingMicButtonActive: {
        backgroundColor: Colors.light.primary,
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    floatingMicContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingMicIcon: {
        fontSize: 28,
    },
    floatingMicLabel: {
        position: 'absolute',
        bottom: -24,
        fontSize: 11,
        color: Colors.light.primary,
        fontWeight: '600',
        whiteSpace: 'nowrap',
    },
    // CSSで描いたマイクアイコン
    micIconBody: {
        width: 16,
        height: 24,
        backgroundColor: '#333',
        borderRadius: 8,
        marginBottom: 2,
    },
    micIconBodyActive: {
        backgroundColor: '#fff',
    },
    micIconStand: {
        width: 2,
        height: 8,
        backgroundColor: '#333',
    },
    micIconStandActive: {
        backgroundColor: '#fff',
    },
    micIconBase: {
        width: 16,
        height: 3,
        backgroundColor: '#333',
        borderRadius: 1,
    },
    micIconBaseActive: {
        backgroundColor: '#fff',
    },

    // インジケーター選択
    indicatorSelectorContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
    },
    indicatorSelectorLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 12,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    indicatorSelector: {
        flexDirection: 'row',
    },
    indicatorButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    indicatorButtonActive: {
        backgroundColor: '#1a1a1a',
    },
    indicatorButtonText: {
        fontSize: 12,
        color: '#666',
    },
    indicatorButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
});
