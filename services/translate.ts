import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// 翻訳用モデル
const translateModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
});

// テキストを日本語に翻訳
export const translateToJapanese = async (text: string): Promise<string> => {
    try {
        const prompt = `以下のテキストを自然な日本語に翻訳してください。翻訳文のみを返し、説明や注釈は不要です。

テキスト:
${text.slice(0, 1500)}`; // 長すぎるレビューは切り詰め

        const result = await translateModel.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Translation failed:', error);
        return text; // 翻訳失敗時は元のテキストを返す
    }
};

// 複数のレビューを一度に翻訳（効率化）
export const translateReviews = async (
    reviews: { id: string; content: string }[]
): Promise<Map<string, string>> => {
    const translations = new Map<string, string>();

    // 並列で翻訳（最大5件ずつ）
    const chunks = [];
    for (let i = 0; i < reviews.length; i += 5) {
        chunks.push(reviews.slice(i, i + 5));
    }

    for (const chunk of chunks) {
        const promises = chunk.map(async (review) => {
            const translated = await translateToJapanese(review.content);
            translations.set(review.id, translated);
        });
        await Promise.all(promises);
    }

    return translations;
};
