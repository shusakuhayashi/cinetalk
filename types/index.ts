// 映画関連の型定義

// TMDb APIからの映画データ
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
}

// 映画詳細
export interface MovieDetails extends Movie {
  runtime: number;
  budget: number;
  revenue: number;
  tagline: string;
  status: string;
  genres: Genre[];
  production_companies: ProductionCompany[];
  credits?: Credits;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

// ユーザーレビュー
export interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  rating: number; // 1-5
  content: string;
  tags: ReviewTag[];
  watched_at: string;
  created_at: string;
  updated_at: string;
}

export type ReviewTag = 
  | '泣けた'
  | '笑えた'
  | '考えさせられた'
  | 'ハラハラした'
  | '感動した'
  | 'ほっこりした'
  | '衝撃的だった'
  | '美しかった';

// ユーザープロフィール
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

// お気に入り
export interface Favorite {
  id: string;
  user_id: string;
  movie_id?: number;
  person_id?: number;
  type: 'movie' | 'director' | 'actor';
  created_at: string;
}

// あとで見るリスト
export interface Watchlist {
  id: string;
  user_id: string;
  movie_id: number;
  added_at: string;
}

// AIチャットメッセージ
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
