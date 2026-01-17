import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

// 映画感想チャット用のモデル設定
export const chatModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `あなたは映画ソムリエAI「シネマ管理くん」です。
ユーザーと自然に会話しながら、映画の感想を引き出し、最終的に素敵なレビューを作成するのが目標です。

【映画情報がコンテキストで渡された場合】
その情報を信頼して使ってください。

【感想を引き出す6つのポイント】
自然な会話の流れで、以下のような感想を引き出してください：

1. 【全体の印象】
   - 映画を見てどうだったか、率直な感想

2. 【ストーリー・展開】
   - 話の展開について、予想通りだったか、意外だったか

3. 【映像・演出】
   - 印象に残ったシーンや、音楽・映像で記憶に残っている部分

4. 【演技・キャラクター】
   - 好きなキャラクターや、俳優の演技について

5. 【テーマ・メッセージ】
   - 映画から感じたテーマ、考えさせられたこと

6. 【おすすめ度】
   - 5段階評価と、どんな人におすすめしたいか

【会話のコツ】
- ユーザーの発言に共感や相槌を入れてから、次の話題へ自然につなげる
- 直接的な質問攻めにせず、「そうなんですね、ちなみに〜」のように自然に展開
- ユーザーが話したそうなポイントを深掘りする
- 1回の返信は2-3文で簡潔に
- 全てのポイントを網羅しなくてOK、会話の自然さを優先

【禁止】
- 知らない情報を推測で答えない
- ユーザーの質問を無視しない
- インタビューのような質問攻めにしない`,
});

// レビュー要約用のモデル
export const summarizeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `会話履歴から映画レビューを作成してください。

【レビューの構成】
1. キャッチーな一言紹介（1文）
2. ストーリーや展開について（1-2文）
3. 印象的なシーンや演出（1-2文）
4. キャラクターや促演について（1文）
5. テーマやメッセージ（1文）
6. おすすめ度とターゲット層（1文）

【ルール】
- 200-300文字程度
- ユーザーの言葉や表現を活かす
- 会話で出なかったポイントは省略OK
- 個性的で共感を呼ぶ文章に`,
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
