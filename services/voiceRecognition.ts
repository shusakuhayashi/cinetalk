// 音声認識サービス
// Web: Web Speech API を使用
// Native: expo-speech + 手動実装（将来的に react-native-voice に移行可能）

import { Platform } from 'react-native';

type VoiceCallback = (text: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;
type StatusCallback = (isListening: boolean) => void;

class VoiceRecognitionService {
    private recognition: any = null;
    private isListening: boolean = false;
    private onResult: VoiceCallback | null = null;
    private onError: ErrorCallback | null = null;
    private onStatusChange: StatusCallback | null = null;

    constructor() {
        if (Platform.OS === 'web') {
            this.initWebSpeech();
        }
    }

    private initWebSpeech() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.lang = 'ja-JP';
                this.recognition.continuous = true;  // 継続モード：ユーザーが停止するまで認識し続ける
                this.recognition.interimResults = true;

                this.recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    // コールバックに最終かどうかのフラグを渡す
                    if (this.onResult) {
                        if (finalTranscript) {
                            this.onResult(finalTranscript, true);
                        } else if (interimTranscript) {
                            this.onResult(interimTranscript, false);
                        }
                    }
                };

                this.recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    if (this.onError) {
                        let errorMessage = '音声認識エラー';
                        switch (event.error) {
                            case 'no-speech':
                                errorMessage = '音声が検出されませんでした';
                                break;
                            case 'audio-capture':
                                errorMessage = 'マイクにアクセスできません';
                                break;
                            case 'not-allowed':
                                errorMessage = 'マイクの使用が許可されていません';
                                break;
                            default:
                                errorMessage = `エラー: ${event.error}`;
                        }
                        this.onError(errorMessage);
                    }
                    this.isListening = false;
                    if (this.onStatusChange) {
                        this.onStatusChange(false);
                    }
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    if (this.onStatusChange) {
                        this.onStatusChange(false);
                    }
                };
            }
        }
    }

    isSupported(): boolean {
        if (Platform.OS === 'web') {
            return this.recognition !== null;
        }
        // ネイティブでは今後対応
        return false;
    }

    start(callbacks: {
        onResult: VoiceCallback;
        onError?: ErrorCallback;
        onStatusChange?: StatusCallback;
    }) {
        this.onResult = callbacks.onResult;
        this.onError = callbacks.onError || null;
        this.onStatusChange = callbacks.onStatusChange || null;

        if (!this.isSupported()) {
            if (this.onError) {
                this.onError('音声認識はこのデバイスでサポートされていません');
            }
            return;
        }

        if (this.isListening) {
            return;
        }

        try {
            this.recognition.start();
            this.isListening = true;
            if (this.onStatusChange) {
                this.onStatusChange(true);
            }
        } catch (error) {
            console.error('Failed to start recognition:', error);
            if (this.onError) {
                this.onError('音声認識の開始に失敗しました');
            }
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            if (this.onStatusChange) {
                this.onStatusChange(false);
            }
        }
    }

    getIsListening(): boolean {
        return this.isListening;
    }
}

// シングルトンインスタンス
export const voiceRecognition = new VoiceRecognitionService();
