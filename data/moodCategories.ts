// 気分カテゴリとジャンルIDのマッピング
// TMDbのジャンルIDを使用して気分別に映画を取得

export interface MoodCategory {
    id: string;
    label: string;           // 表示ラベル
    genreIds: number[];      // 含めたいジャンル
    excludeGenreIds?: number[]; // 除外したいジャンル
    minRating?: number;      // 最低評価
}

export const MOOD_CATEGORIES: MoodCategory[] = [
    // 1. 笑える - コメディ
    {
        id: 'laugh',
        label: '笑える',
        genreIds: [35],
        excludeGenreIds: [27, 53],
        minRating: 6.5,
    },
    // 2. 泣ける - ドラマ・ロマンス
    {
        id: 'cry',
        label: '泣ける',
        genreIds: [18, 10749],
        minRating: 7.5,
    },
    // 3. 燃える - アクション
    {
        id: 'burn',
        label: '燃える',
        genreIds: [28],
        minRating: 6.5,
    },
    // 4. 震える - ホラー
    {
        id: 'shiver',
        label: '震える',
        genreIds: [27],
        minRating: 6.0,
    },
    // 5. 痺れる - スリラー・犯罪
    {
        id: 'thrill',
        label: '痺れる',
        genreIds: [53, 80],
        minRating: 6.5,
    },
    // 6. ときめく - ロマンス
    {
        id: 'flutter',
        label: 'ときめく',
        genreIds: [10749],
        excludeGenreIds: [18],
        minRating: 6.5,
    },
    // 7. 驚く - ミステリー
    {
        id: 'surprise',
        label: '驚く',
        genreIds: [9648],
        minRating: 6.5,
    },
    // 8. 考える - ドキュメンタリー・歴史
    {
        id: 'think',
        label: '考える',
        genreIds: [99, 36],
        minRating: 7.0,
    },
    // 9. 癒される - ファミリー
    {
        id: 'heal',
        label: '癒される',
        genreIds: [10751],
        excludeGenreIds: [27, 53],
        minRating: 6.5,
    },
    // 10. 冒険する - アドベンチャー
    {
        id: 'adventure',
        label: '冒険する',
        genreIds: [12],
        minRating: 6.5,
    },
    // 11. 夢見る - ファンタジー
    {
        id: 'dream',
        label: '夢見る',
        genreIds: [14],
        minRating: 6.5,
    },
    // 12. スカッとする - アクション・アドベンチャー（高評価）
    {
        id: 'refresh',
        label: 'スカッとする',
        genreIds: [28, 12],
        excludeGenreIds: [27, 53],
        minRating: 7.0,
    },
    // 13. 熱くなる - 戦争・スポーツ系ドラマ
    {
        id: 'hot',
        label: '熱くなる',
        genreIds: [10752, 18],
        minRating: 7.0,
    },
    // 14. ハラハラ - サスペンス・スリラー
    {
        id: 'suspense',
        label: 'ハラハラ',
        genreIds: [53, 9648],
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
