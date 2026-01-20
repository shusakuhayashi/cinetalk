// Best3ランキング用カテゴリデータ

// 監督データ（傑作BEST3用）
export interface DirectorData {
    id: number;
    name: string;
    nameJa: string;
}

export const FAMOUS_DIRECTORS: DirectorData[] = [
    { id: 525, name: "Christopher Nolan", nameJa: "クリストファー・ノーラン" },
    { id: 138, name: "Quentin Tarantino", nameJa: "クエンティン・タランティーノ" },
    { id: 488, name: "Steven Spielberg", nameJa: "スティーヴン・スピルバーグ" },
    { id: 1254, name: "Akira Kurosawa", nameJa: "黒澤明" },
    { id: 8857, name: "Hayao Miyazaki", nameJa: "宮崎駿" },
    { id: 3317, name: "Takeshi Kitano", nameJa: "北野武" },
    { id: 1032, name: "Martin Scorsese", nameJa: "マーティン・スコセッシ" },
    { id: 5655, name: "Denis Villeneuve", nameJa: "ドゥニ・ヴィルヌーヴ" },
    { id: 7467, name: "David Fincher", nameJa: "デヴィッド・フィンチャー" },
    { id: 608, name: "James Cameron", nameJa: "ジェームズ・キャメロン" },
    { id: 510, name: "Tim Burton", nameJa: "ティム・バートン" },
    { id: 1769, name: "Sofia Coppola", nameJa: "ソフィア・コッポラ" },
    { id: 240, name: "Stanley Kubrick", nameJa: "スタンリー・キューブリック" },
    { id: 1776, name: "Francis Ford Coppola", nameJa: "フランシス・フォード・コッポラ" },
    { id: 2710, name: "Greta Gerwig", nameJa: "グレタ・ガーウィグ" },
    { id: 84326, name: "Makoto Shinkai", nameJa: "新海誠" },
    { id: 126963, name: "Hirokazu Koreeda", nameJa: "是枝裕和" },
    { id: 5281, name: "Wes Anderson", nameJa: "ウェス・アンダーソン" },
    { id: 5126, name: "Guillermo del Toro", nameJa: "ギレルモ・デル・トロ" },
    { id: 57130, name: "Jordan Peele", nameJa: "ジョーダン・ピール" },
    { id: 16265, name: "Satoshi Kon", nameJa: "今敏" },
];

// 国×年代の組み合わせ（年代別名作BEST3用）
export interface EraCountryData {
    countryCode: string;
    countryName: string;
    decade: string;
    label: string;
}

export const ERA_COUNTRY_COMBINATIONS: EraCountryData[] = [
    // 日本
    { countryCode: "JP", countryName: "日本", decade: "1950", label: "日本の1950年代" },
    { countryCode: "JP", countryName: "日本", decade: "1960", label: "日本の1960年代" },
    { countryCode: "JP", countryName: "日本", decade: "1970", label: "日本の1970年代" },
    { countryCode: "JP", countryName: "日本", decade: "1980", label: "日本の1980年代" },
    { countryCode: "JP", countryName: "日本", decade: "1990", label: "日本の1990年代" },
    { countryCode: "JP", countryName: "日本", decade: "2000", label: "日本の2000年代" },
    { countryCode: "JP", countryName: "日本", decade: "2010", label: "日本の2010年代" },

    // イタリア
    { countryCode: "IT", countryName: "イタリア", decade: "1960", label: "イタリアの1960年代" },
    { countryCode: "IT", countryName: "イタリア", decade: "1970", label: "イタリアの1970年代" },
    { countryCode: "IT", countryName: "イタリア", decade: "1980", label: "イタリアの1980年代" },

    // フランス
    { countryCode: "FR", countryName: "フランス", decade: "1960", label: "フランスの1960年代" },
    { countryCode: "FR", countryName: "フランス", decade: "1970", label: "フランスの1970年代" },
    { countryCode: "FR", countryName: "フランス", decade: "1990", label: "フランスの1990年代" },
    { countryCode: "FR", countryName: "フランス", decade: "2000", label: "フランスの2000年代" },

    // アメリカ
    { countryCode: "US", countryName: "アメリカ", decade: "1970", label: "アメリカの1970年代" },
    { countryCode: "US", countryName: "アメリカ", decade: "1980", label: "アメリカの1980年代" },
    { countryCode: "US", countryName: "アメリカ", decade: "1990", label: "アメリカの1990年代" },
    { countryCode: "US", countryName: "アメリカ", decade: "2000", label: "アメリカの2000年代" },

    // イギリス
    { countryCode: "GB", countryName: "イギリス", decade: "1960", label: "イギリスの1960年代" },
    { countryCode: "GB", countryName: "イギリス", decade: "1990", label: "イギリスの1990年代" },
    { countryCode: "GB", countryName: "イギリス", decade: "2000", label: "イギリスの2000年代" },

    // 韓国
    { countryCode: "KR", countryName: "韓国", decade: "2000", label: "韓国の2000年代" },
    { countryCode: "KR", countryName: "韓国", decade: "2010", label: "韓国の2010年代" },

    // 香港
    { countryCode: "HK", countryName: "香港", decade: "1980", label: "香港の1980年代" },
    { countryCode: "HK", countryName: "香港", decade: "1990", label: "香港の1990年代" },

    // ドイツ
    { countryCode: "DE", countryName: "ドイツ", decade: "1920", label: "ドイツの1920年代" },
    { countryCode: "DE", countryName: "ドイツ", decade: "1980", label: "ドイツの1980年代" },

    // スペイン
    { countryCode: "ES", countryName: "スペイン", decade: "2000", label: "スペインの2000年代" },
];

// 隠れた名作用ジャンル
export interface HiddenGemGenre {
    genreId: number;
    name: string;
    nameJa: string;
}

export const HIDDEN_GEM_GENRES: HiddenGemGenre[] = [
    { genreId: 878, name: "Science Fiction", nameJa: "SF" },
    { genreId: 27, name: "Horror", nameJa: "ホラー" },
    { genreId: 35, name: "Comedy", nameJa: "コメディ" },
    { genreId: 18, name: "Drama", nameJa: "ドラマ" },
    { genreId: 53, name: "Thriller", nameJa: "スリラー" },
    { genreId: 10749, name: "Romance", nameJa: "ロマンス" },
    { genreId: 16, name: "Animation", nameJa: "アニメーション" },
    { genreId: 99, name: "Documentary", nameJa: "ドキュメンタリー" },
    { genreId: 9648, name: "Mystery", nameJa: "ミステリー" },
    { genreId: 80, name: "Crime", nameJa: "犯罪" },
    { genreId: 14, name: "Fantasy", nameJa: "ファンタジー" },
];

// 日本映画ジャンル（日本映画 BEST5用）
export interface JapaneseMovieGenre {
    genreId: number | null;
    name: string;
    nameJa: string;
}

export const JAPANESE_MOVIE_GENRES: JapaneseMovieGenre[] = [
    { genreId: 16, name: "Animation", nameJa: "アニメ" },
    { genreId: 18, name: "Drama", nameJa: "ドラマ" },
    { genreId: 28, name: "Action", nameJa: "アクション" },
    { genreId: 35, name: "Comedy", nameJa: "コメディ" },
    { genreId: 27, name: "Horror", nameJa: "ホラー" },
    { genreId: null, name: "All", nameJa: "全ジャンル" },
];

// 世界の映画（普段触れない国の映画 BEST5用）
export interface WorldCinemaCountry {
    countryCode: string;
    nameJa: string;
    nameEn: string;
}

export const WORLD_CINEMA_COUNTRIES: WorldCinemaCountry[] = [
    // アジア
    { countryCode: "IR", nameJa: "イラン", nameEn: "Iran" },
    { countryCode: "TH", nameJa: "タイ", nameEn: "Thailand" },
    { countryCode: "ID", nameJa: "インドネシア", nameEn: "Indonesia" },
    { countryCode: "PH", nameJa: "フィリピン", nameEn: "Philippines" },
    { countryCode: "VN", nameJa: "ベトナム", nameEn: "Vietnam" },
    { countryCode: "TW", nameJa: "台湾", nameEn: "Taiwan" },
    { countryCode: "IN", nameJa: "インド", nameEn: "India" },

    // ヨーロッパ
    { countryCode: "RO", nameJa: "ルーマニア", nameEn: "Romania" },
    { countryCode: "PL", nameJa: "ポーランド", nameEn: "Poland" },
    { countryCode: "CZ", nameJa: "チェコ", nameEn: "Czech Republic" },
    { countryCode: "GR", nameJa: "ギリシャ", nameEn: "Greece" },
    { countryCode: "HU", nameJa: "ハンガリー", nameEn: "Hungary" },
    { countryCode: "DK", nameJa: "デンマーク", nameEn: "Denmark" },
    { countryCode: "SE", nameJa: "スウェーデン", nameEn: "Sweden" },
    { countryCode: "NO", nameJa: "ノルウェー", nameEn: "Norway" },
    { countryCode: "FI", nameJa: "フィンランド", nameEn: "Finland" },
    { countryCode: "IE", nameJa: "アイルランド", nameEn: "Ireland" },

    // 中南米
    { countryCode: "AR", nameJa: "アルゼンチン", nameEn: "Argentina" },
    { countryCode: "MX", nameJa: "メキシコ", nameEn: "Mexico" },
    { countryCode: "BR", nameJa: "ブラジル", nameEn: "Brazil" },
    { countryCode: "CL", nameJa: "チリ", nameEn: "Chile" },
    { countryCode: "CO", nameJa: "コロンビア", nameEn: "Colombia" },

    // その他
    { countryCode: "NG", nameJa: "ナイジェリア", nameEn: "Nigeria" },
    { countryCode: "ZA", nameJa: "南アフリカ", nameEn: "South Africa" },
    { countryCode: "EG", nameJa: "エジプト", nameEn: "Egypt" },
    { countryCode: "TR", nameJa: "トルコ", nameEn: "Turkey" },
    { countryCode: "IL", nameJa: "イスラエル", nameEn: "Israel" },
    { countryCode: "NZ", nameJa: "ニュージーランド", nameEn: "New Zealand" },
    { countryCode: "IS", nameJa: "アイスランド", nameEn: "Iceland" },
];

// 日替わりでデータを取得するヘルパー
export const getDailyDirector = (): DirectorData => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return FAMOUS_DIRECTORS[dayOfYear % FAMOUS_DIRECTORS.length];
};

export const getDailyEraCountry = (): EraCountryData => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return ERA_COUNTRY_COMBINATIONS[dayOfYear % ERA_COUNTRY_COMBINATIONS.length];
};

export const getDailyHiddenGemGenre = (): HiddenGemGenre => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    // 監督とは別の日に変わるようにオフセット
    return HIDDEN_GEM_GENRES[(dayOfYear + 5) % HIDDEN_GEM_GENRES.length];
};

export const getDailyJapaneseMovieGenre = (): JapaneseMovieGenre => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    // 別のオフセットで日替わり
    return JAPANESE_MOVIE_GENRES[(dayOfYear + 3) % JAPANESE_MOVIE_GENRES.length];
};

export const getDailyWorldCinemaCountry = (): WorldCinemaCountry => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    // 別のオフセットで日替わり（毎日違う国を表示）
    return WORLD_CINEMA_COUNTRIES[(dayOfYear + 7) % WORLD_CINEMA_COUNTRIES.length];
};
