// OpenAI TTS サービス
// 高品質な音声合成を提供

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const TTS_API_URL = 'https://api.openai.com/v1/audio/speech';

export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface TTSOptions {
    voice?: VoiceType;
    speed?: number; // 0.25 to 4.0
}

/**
 * OpenAI TTSで音声を生成
 * @param text 読み上げるテキスト
 * @param options オプション設定
 * @returns 音声データのBase64文字列
 */
export const generateSpeech = async (
    text: string,
    options: TTSOptions = {}
): Promise<string> => {
    const { voice = 'nova', speed = 1.0 } = options;

    try {
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text.slice(0, 4096), // 最大4096文字
                voice: voice,
                speed: speed,
                response_format: 'mp3',
            }),
        });

        if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
        }

        // ArrayBufferを取得してBase64に変換
        const arrayBuffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        return `data:audio/mp3;base64,${base64}`;
    } catch (error) {
        console.error('TTS generation failed:', error);
        throw error;
    }
};

// ArrayBufferをBase64に変換
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * 音声タイプの説明
 */
export const VOICE_DESCRIPTIONS: Record<VoiceType, string> = {
    alloy: '中性的で落ち着いた声',
    echo: '深みのある男性的な声',
    fable: '暖かみのあるナレーション向け',
    onyx: '権威のある力強い声',
    nova: '明るく親しみやすい女性的な声', // デフォルト
    shimmer: '柔らかく優しい声',
};
