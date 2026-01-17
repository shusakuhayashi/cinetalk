// 気分カテゴリとジャンルIDのマッピング
// TMDbのジャンルIDを使用して気分別に映画を取得

import { GENRES } from '../services/tmdb';

export interface MoodCategory {
    id: string;
    label: string;
    labelJa: string;
    description: string;
    genreIds: number[];      // 含めたいジャンル
    excludeGenreIds?: number[]; // 除外したいジャンル
    minRating?: number;      // 最低評価
}

export const MOOD_CATEGORIES: MoodCategory[] = [
    {
        id: 'refreshing',
        label: 'Refreshing',
        labelJa: 'スッキリしたい',
        description: 'アクションやアドベンチャーで爽快な気分に',
        genreIds: [28, 12], // アクション, アドベンチャー
        excludeGenreIds: [27, 53], // ホラー, スリラー除外
        minRating: 7.0,
    },
    {
        id: 'emotional',
        label: 'Emotional',
        labelJa: '泣きたい',
        description: '感動的なドラマやロマンスで心を揺さぶる',
        genreIds: [18, 10749], // ドラマ, ロマンス
        minRating: 7.5,
    },
    {
        id: 'thoughtful',
        label: 'Thoughtful',
        labelJa: '考えさせられたい',
        description: '深いテーマのドキュメンタリーや社会派作品',
        genreIds: [99, 36, 10752], // ドキュメンタリー, 歴史, 戦争
        minRating: 7.0,
    },
    {
        id: 'thrilling',
        label: 'Thrilling',
        labelJa: 'ドキドキしたい',
        description: 'スリルとサスペンスで手に汗握る',
        genreIds: [53, 9648, 80], // スリラー, ミステリー, 犯罪
        minRating: 7.0,
    },
    {
        id: 'relaxing',
        label: 'Relaxing',
        labelJa: 'ボーッとしたい',
        description: '気軽に楽しめるコメディやファミリー映画',
        genreIds: [35, 10751, 16], // コメディ, ファミリー, アニメーション
        excludeGenreIds: [27, 53], // ホラー, スリラー除外
        minRating: 6.5,
    },
];

// 日付ベースで映画を選択するためのシード生成
export const getDailyMoodSeed = (moodId: string): number => {
    const today = new Date();
    const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    // moodIdをハッシュ化して各カテゴリで異なるシードを生成
    const moodHash = moodId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (dayOfYear + moodHash) % 1000;
};
