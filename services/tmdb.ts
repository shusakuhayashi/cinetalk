import { Movie, MovieDetails } from '../types';

const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const baseUrl = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const imageBaseUrl = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// TMDbレビュー型
export interface TMDbReview {
    id: string;
    author: string;
    author_details: {
        name: string;
        username: string;
        avatar_path: string | null;
        rating: number | null;
    };
    content: string;
    created_at: string;
    iso_639_1: string; // 言語コード (en, ja, etc.)
}

// 画像URLを生成
export const getImageUrl = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
    if (!path) return null;
    return `${imageBaseUrl}/${size}${path}`;
};

// 共通のfetchオプション
const fetchOptions = {
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    },
};

// 人気映画を取得（日本）
export const getPopularMovies = async (page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/popular?language=ja-JP&region=JP&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 現在上映中の映画を取得
export const getNowPlayingMovies = async (page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/now_playing?language=ja-JP&region=JP&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 歴代名作（高評価順）を取得
export const getTopRatedMovies = async (page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/top_rated?language=ja-JP&region=JP&page=${page}`,
        fetchOptions
    );
    return response.json();
};


// 映画を検索
export const searchMovies = async (query: string, page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/search/movie?language=ja-JP&query=${encodeURIComponent(query)}&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 映画詳細を取得
export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const response = await fetch(
        `${baseUrl}/movie/${movieId}?language=ja-JP&append_to_response=credits`,
        fetchOptions
    );
    return response.json();
};

// おすすめ映画を取得
export const getRecommendations = async (movieId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/${movieId}/recommendations?language=ja-JP&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 映画レビューを取得（複数言語）
export const getMovieReviews = async (movieId: number, page = 1): Promise<{ results: TMDbReview[]; total_pages: number; total_results: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/${movieId}/reviews?page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 日本語レビューを優先してソート
export const sortReviewsByLanguage = (reviews: TMDbReview[]): TMDbReview[] => {
    return [...reviews].sort((a, b) => {
        // 日本語レビューを最優先
        if (a.iso_639_1 === 'ja' && b.iso_639_1 !== 'ja') return -1;
        if (a.iso_639_1 !== 'ja' && b.iso_639_1 === 'ja') return 1;
        // それ以外は作成日でソート
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
};

// 言語が日本語かどうかを判定
export const isJapanese = (text: string): boolean => {
    // 日本語の文字（ひらがな、カタカナ、漢字）が含まれているか
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
};

// 人物の詳細情報
export interface PersonDetails {
    id: number;
    name: string;
    biography: string;
    birthday: string | null;
    profile_path: string | null;
    place_of_birth: string | null;
    known_for_department: string;
}

// 人物の映画クレジット
export interface PersonCredits {
    cast: Movie[];
    crew: (Movie & { job: string })[];
}

// 人物詳細を取得
export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
    const response = await fetch(
        `${baseUrl}/person/${personId}?language=ja-JP`,
        fetchOptions
    );
    return response.json();
};

// 人物の映画クレジットを取得
export const getPersonMovieCredits = async (personId: number): Promise<PersonCredits> => {
    const response = await fetch(
        `${baseUrl}/person/${personId}/movie_credits?language=ja-JP`,
        fetchOptions
    );
    return response.json();
};

// ジャンルIDの定義
export const GENRES = {
    action: { id: 28, name: 'アクション' },
    adventure: { id: 12, name: 'アドベンチャー' },
    animation: { id: 16, name: 'アニメ' },
    comedy: { id: 35, name: 'コメディ' },
    crime: { id: 80, name: '犯罪' },
    documentary: { id: 99, name: 'ドキュメンタリー' },
    drama: { id: 18, name: 'ドラマ' },
    family: { id: 10751, name: 'ファミリー' },
    fantasy: { id: 14, name: 'ファンタジー' },
    history: { id: 36, name: '歴史' },
    horror: { id: 27, name: 'ホラー' },
    music: { id: 10402, name: '音楽' },
    mystery: { id: 9648, name: 'ミステリー' },
    romance: { id: 10749, name: 'ロマンス' },
    scifi: { id: 878, name: 'SF' },
    thriller: { id: 53, name: 'スリラー' },
    war: { id: 10752, name: '戦争' },
    western: { id: 37, name: '西部劇' },
};

// ジャンル別映画を取得
export const getMoviesByGenre = async (genreId: number, page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/discover/movie?language=ja-JP&region=JP&with_genres=${genreId}&sort_by=popularity.desc&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// 今週のトレンド映画を取得
export const getTrendingMovies = async (): Promise<{ results: Movie[] }> => {
    const response = await fetch(
        `${baseUrl}/trending/movie/week?language=ja-JP`,
        fetchOptions
    );
    return response.json();
};

// 近日公開映画を取得
export const getUpcomingMovies = async (page = 1): Promise<{ results: Movie[]; total_pages: number }> => {
    const response = await fetch(
        `${baseUrl}/movie/upcoming?language=ja-JP&region=JP&page=${page}`,
        fetchOptions
    );
    return response.json();
};

// Watch Provider型
export interface WatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
    display_priority: number;
}

export interface WatchProviderResult {
    link?: string;  // JustWatchへのリンク
    flatrate?: WatchProvider[];  // 定額見放題
    rent?: WatchProvider[];      // レンタル
    buy?: WatchProvider[];       // 購入
}

export interface WatchProvidersResponse {
    id: number;
    results: {
        JP?: WatchProviderResult;
        [key: string]: WatchProviderResult | undefined;
    };
}

// 映画の視聴可能な配信サービスを取得（日本）
export const getWatchProviders = async (movieId: number): Promise<WatchProviderResult | null> => {
    try {
        const response = await fetch(
            `${baseUrl}/movie/${movieId}/watch/providers`,
            fetchOptions
        );
        const data: WatchProvidersResponse = await response.json();

        // 日本のデータを返す
        return data.results?.JP || null;
    } catch (error) {
        console.error('Watch providers fetch error:', error);
        return null;
    }
};

// アフィリエイトタグ（環境変数から取得、未設定時は空）
const AMAZON_AFFILIATE_TAG = process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || '';

// 配信サービスのURL設定（provider_idベース）
interface ProviderUrlConfig {
    getUrl: (title: string) => string;
}

const PROVIDER_URL_CONFIG: { [providerId: number]: ProviderUrlConfig } = {
    // Netflix (provider_id: 8)
    8: {
        getUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    },
    // Amazon Video (provider_id: 10) - アフィリエイト対応
    10: {
        getUrl: (title) => {
            const baseUrl = `https://www.amazon.co.jp/gp/video/search?phrase=${encodeURIComponent(title)}`;
            return AMAZON_AFFILIATE_TAG ? `${baseUrl}&tag=${AMAZON_AFFILIATE_TAG}` : baseUrl;
        },
    },
    // Apple TV (provider_id: 2)
    2: {
        getUrl: (title) => `https://tv.apple.com/jp/search?term=${encodeURIComponent(title)}`,
    },
    // Google Play Movies (provider_id: 3)
    3: {
        getUrl: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`,
    },
    // U-NEXT (provider_id: 84)
    84: {
        getUrl: (title) => `https://video.unext.jp/freeword?query=${encodeURIComponent(title)}`,
    },
    // Disney Plus (provider_id: 337)
    337: {
        getUrl: (title) => `https://www.disneyplus.com/ja-jp/search?q=${encodeURIComponent(title)}`,
    },
    // Hulu Japan (provider_id: 15)
    15: {
        getUrl: (title) => `https://www.hulu.jp/search?q=${encodeURIComponent(title)}`,
    },
    // ABEMA (provider_id: 533)
    533: {
        getUrl: (title) => `https://abema.tv/search?q=${encodeURIComponent(title)}`,
    },
    // Rakuten TV (provider_id: 344)
    344: {
        getUrl: (title) => `https://tv.rakuten.co.jp/search/?sr=${encodeURIComponent(title)}`,
    },
    // YouTube (provider_id: 192)
    192: {
        getUrl: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}+映画`,
    },
    // dTV / Lemino (provider_id: 85)
    85: {
        getUrl: (title) => `https://lemino.docomo.ne.jp/search/keyword?query=${encodeURIComponent(title)}`,
    },
    // WOWOW (provider_id: 515)
    515: {
        getUrl: (title) => `https://www.wowow.co.jp/search/?keyword=${encodeURIComponent(title)}`,
    },
    // Amazon Prime Video (provider_id: 9) - アフィリエイト対応
    9: {
        getUrl: (title) => {
            const baseUrl = `https://www.amazon.co.jp/gp/video/search?phrase=${encodeURIComponent(title)}`;
            return AMAZON_AFFILIATE_TAG ? `${baseUrl}&tag=${AMAZON_AFFILIATE_TAG}` : baseUrl;
        },
    },
    // FOD (provider_id: 688)
    688: {
        getUrl: (title) => `https://fod.fujitv.co.jp/search/?q=${encodeURIComponent(title)}`,
    },
    // Paravi / U-NEXT (provider_id: 97) - Paraviは現在U-NEXTに統合
    97: {
        getUrl: (title) => `https://video.unext.jp/freeword?query=${encodeURIComponent(title)}`,
    },
    // TELASA (provider_id: 429)
    429: {
        getUrl: (title) => `https://www.telasa.jp/search?query=${encodeURIComponent(title)}`,
    },
};

/**
 * 配信サービスのURLを取得
 * @param providerId TMDbのprovider_id
 * @param movieTitle 映画タイトル
 * @param fallbackLink TMDbから取得したlinkフィールド（JustWatch経由）
 * @returns 配信サービスの検索URL
 */
export const getProviderUrl = (
    providerId: number,
    movieTitle: string,
    fallbackLink?: string
): string => {
    const config = PROVIDER_URL_CONFIG[providerId];

    if (config) {
        return config.getUrl(movieTitle);
    }

    // 未知のprovider_idはTMDbのlink（JustWatch経由）を使用
    if (fallbackLink) {
        return fallbackLink;
    }

    // 最終フォールバック: 映画タイトルでGoogle検索
    return `https://www.google.com/search?q=${encodeURIComponent(movieTitle)}+視聴`;
};

// 後方互換性のため旧関数名もエクスポート（非推奨）
/** @deprecated getProviderUrl を使用してください */
export const getProviderSearchUrl = (providerName: string, movieTitle: string): string => {
    // 名前からprovider_idを推測（後方互換性のみ）
    const nameToId: { [key: string]: number } = {
        'netflix': 8,
        'amazon': 10,
        'apple': 2,
        'google': 3,
        'u-next': 84,
        'unext': 84,
        'disney': 337,
        'hulu': 15,
        'abema': 533,
    };

    const lowerName = providerName.toLowerCase();
    const providerId = Object.entries(nameToId).find(([key]) => lowerName.includes(key))?.[1];

    return getProviderUrl(providerId || 0, movieTitle);
};

// ====== ホーム画面新機能用 ======

// 気分別映画を取得
export const getMoviesByMood = async (
    genreIds: number[],
    excludeGenreIds: number[] = [],
    minRating: number = 6.5,
    seed: number = 0
): Promise<Movie | null> => {
    try {
        // ジャンルIDを|（OR）で結合して、いずれかのジャンルに該当する映画を取得
        const genreParam = genreIds.join('|');
        const excludeParam = excludeGenreIds.length > 0 ? `&without_genres=${excludeGenreIds.join(',')}` : '';

        const response = await fetch(
            `${baseUrl}/discover/movie?language=ja-JP&region=JP&with_genres=${genreParam}${excludeParam}&vote_average.gte=${minRating}&vote_count.gte=100&sort_by=popularity.desc&page=${(seed % 3) + 1}`,
            fetchOptions
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // シードを使って日替わりで異なる映画を選択
            const index = seed % data.results.length;
            return data.results[index];
        }
        return null;
    } catch (error) {
        console.error('Mood movies fetch error:', error);
        return null;
    }
};

// 人物の代表作を取得
export const getPersonCredits = async (personId: number): Promise<Movie[]> => {
    try {
        const response = await fetch(
            `${baseUrl}/person/${personId}/movie_credits?language=ja-JP`,
            fetchOptions
        );
        const data = await response.json();

        // 出演作と監督作を統合
        const cast = data.cast || [];
        const crew = (data.crew || []).filter((m: any) => m.job === 'Director');
        const combined = [...cast, ...crew];

        // 重複を除去
        const uniqueMovies = Array.from(
            new Map(combined.map((m: Movie) => [m.id, m])).values()
        ) as Movie[];

        // vote_count（投票数=知名度）順でソートして代表作を優先表示
        return uniqueMovies
            .filter((m: Movie) => m.poster_path)
            .sort((a: Movie, b: Movie) => (b.vote_count || 0) - (a.vote_count || 0))
            .slice(0, 5);
    } catch (error) {
        console.error('Person credits fetch error:', error);
        return [];
    }
};

// アニバーサリー映画を取得（今日と同じ月日に公開された名作）
export const getAnniversaryMovies = async (): Promise<{ movie: Movie; years: number }[]> => {
    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const anniversaryMovies: { movie: Movie; years: number }[] = [];

        // 複数ページから検索して今日と同じ月日の映画を見つける
        for (let page = 1; page <= 10 && anniversaryMovies.length < 3; page++) {
            const response = await fetch(
                `${baseUrl}/discover/movie?language=ja-JP&sort_by=vote_count.desc&vote_average.gte=7.0&vote_count.gte=500&primary_release_date.lte=${today.getFullYear()}-12-31&page=${page}`,
                fetchOptions
            );
            const data = await response.json();

            for (const movie of data.results || []) {
                if (movie.release_date) {
                    const releaseDate = movie.release_date.split('-'); // YYYY-MM-DD
                    if (releaseDate[1] === month && releaseDate[2] === day) {
                        const years = today.getFullYear() - parseInt(releaseDate[0]);
                        if (years >= 5) { // 5年以上前の作品のみ
                            anniversaryMovies.push({ movie, years });
                            if (anniversaryMovies.length >= 3) break;
                        }
                    }
                }
            }
        }

        return anniversaryMovies;
    } catch (error) {
        console.error('Anniversary movies fetch error:', error);
        return [];
    }
};

// 映画のトリビア情報を取得（制作費・興行収入など）
export const getMovieTrivia = async (movieId: number): Promise<{
    budget: number;
    revenue: number;
    productionCountries: string[];
    productionCompanies: string[];
    tagline: string;
} | null> => {
    try {
        const response = await fetch(
            `${baseUrl}/movie/${movieId}?language=ja-JP`,
            fetchOptions
        );
        const data = await response.json();

        return {
            budget: data.budget || 0,
            revenue: data.revenue || 0,
            productionCountries: (data.production_countries || []).map((c: any) => c.name),
            productionCompanies: (data.production_companies || []).map((c: any) => c.name),
            tagline: data.tagline || '',
        };
    } catch (error) {
        console.error('Movie trivia fetch error:', error);
        return null;
    }
};

// ====== BEST3ランキング機能 ======

// 監督の傑作BEST5を取得
export const getDirectorBest5 = async (directorId: number): Promise<Movie[]> => {
    try {
        const response = await fetch(
            `${baseUrl}/person/${directorId}/movie_credits?language=ja-JP`,
            fetchOptions
        );
        const data = await response.json();

        // 監督作品のみをフィルタリング
        const directedMovies = (data.crew || []).filter((m: any) => m.job === 'Director');

        // 人気度と評価の高い順にソートしてTOP5を返す
        return directedMovies
            .filter((m: Movie) => m.poster_path)
            .sort((a: Movie, b: Movie) => {
                // まず評価でソート、同じなら人気度でソート
                const ratingDiff = (b.vote_average || 0) - (a.vote_average || 0);
                if (ratingDiff !== 0) return ratingDiff;
                return (b.popularity || 0) - (a.popularity || 0);
            })
            .slice(0, 5);
    } catch (error) {
        console.error('Director best5 fetch error:', error);
        return [];
    }
};

// 年代別×国別名作BEST5を取得
export const getEraCountryBest5 = async (
    countryCode: string,
    decadeStart: string
): Promise<Movie[]> => {
    try {
        const startYear = parseInt(decadeStart);
        const endYear = startYear + 9;

        const response = await fetch(
            `${baseUrl}/discover/movie?language=ja-JP&with_origin_country=${countryCode}&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&sort_by=vote_average.desc&vote_count.gte=200&vote_average.gte=7.0`,
            fetchOptions
        );
        const data = await response.json();

        return (data.results || [])
            .filter((m: Movie) => m.poster_path)
            .slice(0, 5);
    } catch (error) {
        console.error('Era country best5 fetch error:', error);
        return [];
    }
};

// 隠れた名作BEST5を取得（評価が高いが投票数が少ないもの）
export const getHiddenGemBest5 = async (genreId: number): Promise<Movie[]> => {
    try {
        const response = await fetch(
            `${baseUrl}/discover/movie?language=ja-JP&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=50&vote_count.lte=500&vote_average.gte=7.5`,
            fetchOptions
        );
        const data = await response.json();

        // ランダム性を追加するために日付ベースでオフセット
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        const offset = (dayOfYear * 5) % Math.max(1, (data.results?.length || 1) - 5);

        return (data.results || [])
            .filter((m: Movie) => m.poster_path)
            .slice(offset, offset + 5);
    } catch (error) {
        console.error('Hidden gem best5 fetch error:', error);
        return [];
    }
};

// 世界の映画BEST5を取得（普段触れない国の映画）
export const getWorldCinemaBest5 = async (countryCode: string): Promise<Movie[]> => {
    try {
        const response = await fetch(
            `${baseUrl}/discover/movie?language=ja-JP&with_origin_country=${countryCode}&sort_by=vote_average.desc&vote_count.gte=50&vote_average.gte=6.5`,
            fetchOptions
        );
        const data = await response.json();

        // ランダム性を追加
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        const offset = (dayOfYear * 2) % Math.max(1, (data.results?.length || 1) - 5);

        return (data.results || [])
            .filter((m: Movie) => m.poster_path)
            .slice(offset, offset + 5);
    } catch (error) {
        console.error('World cinema best5 fetch error:', error);
        return [];
    }
};

// 日本映画BEST5を取得
export const getJapaneseMovieBest5 = async (genreId: number | null): Promise<Movie[]> => {
    try {
        const genreParam = genreId ? `&with_genres=${genreId}` : '';
        const response = await fetch(
            `${baseUrl}/discover/movie?language=ja-JP&with_origin_country=JP${genreParam}&sort_by=vote_average.desc&vote_count.gte=100&vote_average.gte=7.0`,
            fetchOptions
        );
        const data = await response.json();

        // ランダム性を追加
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        const offset = (dayOfYear * 2) % Math.max(1, (data.results?.length || 1) - 5);

        return (data.results || [])
            .filter((m: Movie) => m.poster_path)
            .slice(offset, offset + 5);
    } catch (error) {
        console.error('Japanese movie best5 fetch error:', error);
        return [];
    }
};
