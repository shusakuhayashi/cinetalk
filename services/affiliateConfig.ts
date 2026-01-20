// 配信サービスのアフィリエイトリンク設定
// ASPに登録後、.envファイルに各サービスのアフィリエイトURLを設定してください

// 環境変数からアフィリエイトリンクを取得
// 設定されていない場合は通常の検索URLを使用します

type ProviderConfig = {
    name: string;
    affiliateEnvKey: string;  // 環境変数のキー名
    getSearchUrl: (movieTitle: string) => string;  // 通常の検索URL生成
    supportsAffiliate: boolean;  // アフィリエイト対応可否
    affiliateNote?: string;  // ASP情報メモ
};

// 配信サービス設定
export const providerConfigs: { [providerId: number]: ProviderConfig } = {
    // U-NEXT (provider_id: 84)
    84: {
        name: 'U-NEXT',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_UNEXT',
        getSearchUrl: (title) => `https://video.unext.jp/freeword?query=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net, afb, アクセストレード, Link-AG で提携可能',
    },

    // Amazon Prime Video (provider_id: 9, 119)
    9: {
        name: 'Amazon Prime Video',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_AMAZON_TAG',
        getSearchUrl: (title) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}&i=prime-instant-video`,
        supportsAffiliate: true,
        affiliateNote: 'Amazonアソシエイト（タグIDを設定）',
    },
    119: {
        name: 'Amazon Video',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_AMAZON_TAG',
        getSearchUrl: (title) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(title)}&i=instant-video`,
        supportsAffiliate: true,
        affiliateNote: 'Amazonアソシエイト（タグIDを設定）',
    },

    // Netflix (provider_id: 8) - アフィリエイトなし
    8: {
        name: 'Netflix',
        affiliateEnvKey: '',
        getSearchUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: false,
        affiliateNote: '公式アフィリエイトプログラムなし',
    },

    // Disney+ (provider_id: 337, 390)
    337: {
        name: 'Disney Plus',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_DISNEY_PLUS',
        getSearchUrl: (title) => `https://www.disneyplus.com/ja-jp/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'afb, アクセストレード で提携可能',
    },
    390: {
        name: 'Disney Plus',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_DISNEY_PLUS',
        getSearchUrl: (title) => `https://www.disneyplus.com/ja-jp/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'afb, アクセストレード で提携可能',
    },

    // Hulu (provider_id: 15, 17)
    15: {
        name: 'Hulu',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_HULU',
        getSearchUrl: (title) => `https://www.hulu.jp/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'バリューコマース, afb, アクセストレード で提携可能',
    },
    17: {
        name: 'Hulu',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_HULU',
        getSearchUrl: (title) => `https://www.hulu.jp/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'バリューコマース, afb, アクセストレード で提携可能',
    },

    // Apple TV (provider_id: 2, 350)
    2: {
        name: 'Apple TV',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_APPLE_TV',
        getSearchUrl: (title) => `https://tv.apple.com/jp/search?term=${encodeURIComponent(title)}`,
        supportsAffiliate: false,
        affiliateNote: 'Appleアフィリエイト（Performance Partners）',
    },
    350: {
        name: 'Apple TV Plus',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_APPLE_TV',
        getSearchUrl: (title) => `https://tv.apple.com/jp/search?term=${encodeURIComponent(title)}`,
        supportsAffiliate: false,
        affiliateNote: 'Appleアフィリエイト（Performance Partners）',
    },

    // Google Play Movies (provider_id: 3)
    3: {
        name: 'Google Play Movies',
        affiliateEnvKey: '',
        getSearchUrl: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`,
        supportsAffiliate: false,
        affiliateNote: 'アフィリエイトプログラムなし',
    },

    // YouTube (provider_id: 192)
    192: {
        name: 'YouTube',
        affiliateEnvKey: '',
        getSearchUrl: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+movie`,
        supportsAffiliate: false,
    },

    // ABEMA (provider_id: 240)
    240: {
        name: 'ABEMA',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_ABEMA',
        getSearchUrl: (title) => `https://abema.tv/search?q=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net, バリューコマース で提携可能',
    },

    // Rakuten TV (provider_id: 97)
    97: {
        name: 'Rakuten TV',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_RAKUTEN_TV',
        getSearchUrl: (title) => `https://tv.rakuten.co.jp/search/?sr=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: '楽天アフィリエイト',
    },

    // dTV / Lemino (provider_id: 85)
    85: {
        name: 'dTV',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_DTV',
        getSearchUrl: (title) => `https://lemino.docomo.ne.jp/search?query=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'アクセストレード で提携可能',
    },

    // WOWOW (provider_id: 99)
    99: {
        name: 'WOWOW',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_WOWOW',
        getSearchUrl: (title) => `https://www.wowow.co.jp/search/?keyword=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net, バリューコマース で提携可能',
    },

    // DMM TV (provider_id: 1796)
    1796: {
        name: 'DMM TV',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_DMM_TV',
        getSearchUrl: (title) => `https://tv.dmm.com/vod/list/?keyword=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net, afb で提携可能',
    },

    // FOD (provider_id: 149) - Fuji TV On Demand
    149: {
        name: 'FOD',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_FOD',
        getSearchUrl: (title) => `https://fod.fujitv.co.jp/search/?keyword=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net で提携可能',
    },

    // TELASA (provider_id: 97)
    86: {
        name: 'TELASA',
        affiliateEnvKey: 'EXPO_PUBLIC_AFFILIATE_TELASA',
        getSearchUrl: (title) => `https://www.telasa.jp/search?keyword=${encodeURIComponent(title)}`,
        supportsAffiliate: true,
        affiliateNote: 'A8.net で提携可能',
    },

    // Paravi (現在はU-NEXTに統合)
    // provider_id: 96 の場合はU-NEXTにリダイレクト
};

/**
 * 配信サービスのURLを取得する
 * アフィリエイトリンクが設定されていれば優先、なければ通常の検索URL
 */
export const getProviderUrl = (providerId: number, providerName: string, movieTitle: string): string => {
    const config = providerConfigs[providerId];

    if (config) {
        // アフィリエイトリンクが環境変数に設定されているかチェック
        if (config.affiliateEnvKey) {
            const affiliateUrl = process.env[config.affiliateEnvKey];

            // Amazonの場合はタグIDをURLに付与
            if (providerId === 9 || providerId === 119) {
                const amazonTag = process.env.EXPO_PUBLIC_AFFILIATE_AMAZON_TAG;
                if (amazonTag) {
                    return `${config.getSearchUrl(movieTitle)}&tag=${amazonTag}`;
                }
            }

            // 他のサービスはアフィリエイトURL全体を設定
            if (affiliateUrl) {
                return affiliateUrl;
            }
        }

        // アフィリエイト未設定の場合は通常の検索URL
        return config.getSearchUrl(movieTitle);
    }

    // 設定がないプロバイダーはGoogle検索にフォールバック
    return `https://www.google.com/search?q=${encodeURIComponent(movieTitle)}+${encodeURIComponent(providerName)}+視聴`;
};

/**
 * プロバイダーの設定情報を取得（デバッグ・管理用）
 */
export const getProviderInfo = (providerId: number): ProviderConfig | null => {
    return providerConfigs[providerId] || null;
};

/**
 * 主要な日本の配信サービス（「他のサービスで探す」セクション用）
 * TMDbのデータに関係なく常に表示されます
 */
export interface AdditionalProvider {
    id: number;
    name: string;
    logoUrl: string; // ローカルまたはCDNからのロゴ画像
    color: string; // ブランドカラー
}

export const additionalProviders: AdditionalProvider[] = [
    {
        id: 84,
        name: 'U-NEXT',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/U-NEXT_logo.svg/200px-U-NEXT_logo.svg.png',
        color: '#00BFFF',
    },
    {
        id: 8,
        name: 'Netflix',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/200px-Netflix_2015_logo.svg.png',
        color: '#E50914',
    },
    {
        id: 15,
        name: 'Hulu',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hulu_Logo.svg/200px-Hulu_Logo.svg.png',
        color: '#1CE783',
    },
    {
        id: 9,
        name: 'Prime Video',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_Prime_Video_logo.svg/200px-Amazon_Prime_Video_logo.svg.png',
        color: '#00A8E1',
    },
    {
        id: 240,
        name: 'ABEMA',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/ABEMA_logo.svg/200px-ABEMA_logo.svg.png',
        color: '#00C73C',
    },
    {
        id: 85,
        name: 'Lemino',
        logoUrl: 'https://lemino.docomo.ne.jp/favicon.ico',
        color: '#FF6B6B',
    },
    {
        id: 97,
        name: '楽天TV',
        logoUrl: 'https://tv.rakuten.co.jp/favicon.ico',
        color: '#BF0000',
    },
    {
        id: 86,
        name: 'TELASA',
        logoUrl: 'https://www.telasa.jp/favicon.ico',
        color: '#FF5722',
    },
];

/**
 * 追加プロバイダーのURLを取得（アフィリエイト対応）
 */
export const getAdditionalProviderUrl = (providerId: number, movieTitle: string): string => {
    return getProviderUrl(providerId, '', movieTitle);
};
