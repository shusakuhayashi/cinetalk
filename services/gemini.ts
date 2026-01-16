import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

// 映画感想チャット用のモデル設定
export const chatModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `あなたは映画ソムリエAIです。ユーザーと映画について会話します。

【映画情報がコンテキストで渡された場合】
その情報を信頼して使ってください。ユーザーからの質問には正確に答えてください。

【ユーザーの質問には必ず答える】
- 「監督は誰？」→ コンテキストの監督名を答える
- 「誰が出てる？」→ コンテキストのキャスト名を答える
- 「どんな話？」→ あらすじを要約して答える

【感想を引き出す質問】
基本情報の質問に答えた後、感想を聞く：
- 「どのシーンが印象的でしたか？」
- 「どんな気持ちになりましたか？」
- 「★5段階で評価するなら？」

【会話のルール】
- 1回の返信は2-3文
- ユーザーの質問に必ず答えてから、次の質問をする
- 同じ質問を繰り返さない

【禁止】
- 知らない情報を推測で答えない
- 同じ質問を2回以上しない
- ユーザーの質問を無視しない`,
});

// レビュー要約用のモデル
export const summarizeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `会話履歴から映画レビューを作成。150文字以内で：
1. 一言紹介
2. 印象的だったポイント
3. おすすめ度`,
});

// 映画原題検索用のモデル
export const titleSearchModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `あなたは映画タイトルの翻訳専門家です。
日本語の映画タイトルを受け取り、その映画の原題（韓国語、英語、中国語など）を返します。

【ルール】
- 原題のみを返してください（説明不要）
- わからない場合は「不明」と返してください
- 複数の候補がある場合は最も可能性の高いものを1つだけ返してください`,
});

// 日本語タイトルから原題を検索
export const findOriginalTitle = async (japaneseTitle: string): Promise<string | null> => {
    try {
        const prompt = `映画「${japaneseTitle}」の原題（韓国語、英語、または元の言語）を教えてください。タイトルのみを回答してください。`;

        const result = await titleSearchModel.generateContent(prompt);
        const originalTitle = result.response.text().trim();

        if (originalTitle === '不明' || originalTitle.length === 0) {
            return null;
        }

        console.log(`[Title Translation] ${japaneseTitle} → ${originalTitle}`);
        return originalTitle;
    } catch (error) {
        console.error('Title search error:', error);
        return null;
    }
};

// 気分診断用のモデル
export const moodModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `映画コンシェルジュとして、ユーザーの気分に合う映画を提案します。`,
});

// おすすめ生成用のモデル
export const recommendModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `ユーザーの鑑賞履歴から映画を提案します。`,
});

export { genAI };
