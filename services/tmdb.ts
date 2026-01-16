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
    action: { id: 28, name: 'アクション', emoji: '💥' },
    adventure: { id: 12, name: 'アドベンチャー', emoji: '🗺️' },
    animation: { id: 16, name: 'アニメ', emoji: '🎨' },
    comedy: { id: 35, name: 'コメディ', emoji: '😂' },
    crime: { id: 80, name: '犯罪', emoji: '🔪' },
    documentary: { id: 99, name: 'ドキュメンタリー', emoji: '📹' },
    drama: { id: 18, name: 'ドラマ', emoji: '🎭' },
    family: { id: 10751, name: 'ファミリー', emoji: '👨‍👩‍👧' },
    fantasy: { id: 14, name: 'ファンタジー', emoji: '🧙' },
    history: { id: 36, name: '歴史', emoji: '📜' },
    horror: { id: 27, name: 'ホラー', emoji: '👻' },
    music: { id: 10402, name: '音楽', emoji: '🎵' },
    mystery: { id: 9648, name: 'ミステリー', emoji: '🔍' },
    romance: { id: 10749, name: 'ロマンス', emoji: '💕' },
    scifi: { id: 878, name: 'SF', emoji: '🚀' },
    thriller: { id: 53, name: 'スリラー', emoji: '😱' },
    war: { id: 10752, name: '戦争', emoji: '⚔️' },
    western: { id: 37, name: '西部劇', emoji: '🤠' },
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
