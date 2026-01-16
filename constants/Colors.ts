/**
 * ミニマル・モダンカラーパレット
 * - モノクロ基調
 * - 余白を活かしたクリーンなデザイン
 * - タイポグラフィ重視
 */

export const Colors = {
    light: {
        // 基本色（モノクロ基調）
        background: '#FAFAFA',
        surface: '#FFFFFF',
        primary: '#000000',
        text: '#1A1A1A',
        textMuted: '#6B6B6B',
        textLight: '#999999',
        border: '#EBEBEB',
        divider: '#F0F0F0',

        // アクセントカラー（控えめ）
        accent: '#000000',
        accentLight: '#333333',

        // セカンダリ
        secondary: '#666666',

        // ヘッダー（ダーク）
        headerBg: '#000000',
        headerText: '#FFFFFF',

        // 評価の星
        star: '#000000',
        starEmpty: '#D0D0D0',

        // タブバー
        tabBg: '#FFFFFF',
        tabActive: '#000000',
        tabInactive: '#AAAAAA',

        // 成功/エラー
        success: '#1A1A1A',
        error: '#CC0000',

        // カード
        cardBg: '#FFFFFF',
        cardBorder: '#F0F0F0',
    },
};

// レビュータグの色（モノクロ）
export const TagColors: Record<string, string> = {
    '泣けた': '#333333',
    '笑えた': '#444444',
    '考えさせられた': '#555555',
    'ハラハラした': '#333333',
    '感動した': '#444444',
    'ほっこりした': '#555555',
    '衝撃的だった': '#333333',
    '美しかった': '#444444',
};
