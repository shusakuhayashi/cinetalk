// 有名俳優・監督の誕生日データ
// TMDb APIには誕生日検索がないため、事前にリストを用意

export interface BirthdayPerson {
    id: number;
    name: string;
    nameJa: string;
    birthday: string; // MM-DD format
    birthYear?: number; // 生年
    deathYear?: number; // 没年（故人の場合）
    type: 'actor' | 'director';
    knownFor?: string; // 代表作
}

// 主要な俳優・監督（各月に複数人配置）
export const FAMOUS_PEOPLE: BirthdayPerson[] = [
    // 1月
    { id: 6384, name: "Keanu Reeves", nameJa: "キアヌ・リーブス", birthday: "09-02", birthYear: 1964, type: "actor", knownFor: "マトリックス" },
    { id: 3223, name: "Robert Downey Jr.", nameJa: "ロバート・ダウニー・Jr", birthday: "04-04", birthYear: 1965, type: "actor", knownFor: "アイアンマン" },
    { id: 500, name: "Tom Cruise", nameJa: "トム・クルーズ", birthday: "07-03", birthYear: 1962, type: "actor", knownFor: "トップガン" },
    { id: 6193, name: "Leonardo DiCaprio", nameJa: "レオナルド・ディカプリオ", birthday: "11-11", birthYear: 1974, type: "actor", knownFor: "タイタニック" },
    { id: 287, name: "Brad Pitt", nameJa: "ブラッド・ピット", birthday: "12-18", birthYear: 1963, type: "actor", knownFor: "ファイト・クラブ" },
    { id: 1892, name: "Matt Damon", nameJa: "マット・デイモン", birthday: "10-08", birthYear: 1970, type: "actor", knownFor: "ボーン・アイデンティティ" },
    { id: 17419, name: "Bryan Cranston", nameJa: "ブライアン・クランストン", birthday: "03-07", birthYear: 1956, type: "actor", knownFor: "ブレイキング・バッド" },
    { id: 73968, name: "Henry Cavill", nameJa: "ヘンリー・カヴィル", birthday: "05-05", birthYear: 1983, type: "actor", knownFor: "マン・オブ・スティール" },
    { id: 17276, name: "Chris Pratt", nameJa: "クリス・プラット", birthday: "06-21", birthYear: 1979, type: "actor", knownFor: "ガーディアンズ・オブ・ギャラクシー" },
    { id: 74568, name: "Chris Hemsworth", nameJa: "クリス・ヘムズワース", birthday: "08-11", birthYear: 1983, type: "actor", knownFor: "マイティ・ソー" },

    // 女優
    { id: 1245, name: "Scarlett Johansson", nameJa: "スカーレット・ヨハンソン", birthday: "11-22", birthYear: 1984, type: "actor", knownFor: "アベンジャーズ" },
    { id: 1813, name: "Anne Hathaway", nameJa: "アン・ハサウェイ", birthday: "11-12", birthYear: 1982, type: "actor", knownFor: "レ・ミゼラブル" },
    { id: 1373, name: "Emma Watson", nameJa: "エマ・ワトソン", birthday: "04-15", birthYear: 1990, type: "actor", knownFor: "ハリー・ポッター" },
    { id: 72129, name: "Jennifer Lawrence", nameJa: "ジェニファー・ローレンス", birthday: "08-15", birthYear: 1990, type: "actor", knownFor: "ハンガー・ゲーム" },
    { id: 115440, name: "Sydney Sweeney", nameJa: "シドニー・スウィーニー", birthday: "09-12", birthYear: 1997, type: "actor", knownFor: "ユーフォリア" },
    { id: 234352, name: "Margot Robbie", nameJa: "マーゴット・ロビー", birthday: "07-02", birthYear: 1990, type: "actor", knownFor: "バービー" },
    { id: 1397778, name: "Zendaya", nameJa: "ゼンデイヤ", birthday: "09-01", birthYear: 1996, type: "actor", knownFor: "スパイダーマン" },
    { id: 224513, name: "Ana de Armas", nameJa: "アナ・デ・アルマス", birthday: "04-30", birthYear: 1988, type: "actor", knownFor: "ノー・タイム・トゥ・ダイ" },

    // 監督
    { id: 525, name: "Christopher Nolan", nameJa: "クリストファー・ノーラン", birthday: "07-30", birthYear: 1970, type: "director", knownFor: "インセプション" },
    { id: 138, name: "Quentin Tarantino", nameJa: "クエンティン・タランティーノ", birthday: "03-27", birthYear: 1963, type: "director", knownFor: "パルプ・フィクション" },
    { id: 488, name: "Steven Spielberg", nameJa: "スティーヴン・スピルバーグ", birthday: "12-18", birthYear: 1946, type: "director", knownFor: "ジュラシック・パーク" },
    { id: 1032, name: "Martin Scorsese", nameJa: "マーティン・スコセッシ", birthday: "11-17", birthYear: 1942, type: "director", knownFor: "グッドフェローズ" },
    { id: 578, name: "Ridley Scott", nameJa: "リドリー・スコット", birthday: "11-30", birthYear: 1937, type: "director", knownFor: "グラディエーター" },
    { id: 7467, name: "David Fincher", nameJa: "デヴィッド・フィンチャー", birthday: "08-28", birthYear: 1962, type: "director", knownFor: "セブン" },
    { id: 5655, name: "Denis Villeneuve", nameJa: "ドゥニ・ヴィルヌーヴ", birthday: "10-03", birthYear: 1967, type: "director", knownFor: "デューン" },
    { id: 608, name: "James Cameron", nameJa: "ジェームズ・キャメロン", birthday: "08-16", birthYear: 1954, type: "director", knownFor: "アバター" },
    { id: 57130, name: "Jordan Peele", nameJa: "ジョーダン・ピール", birthday: "02-21", birthYear: 1979, type: "director", knownFor: "ゲット・アウト" },
    { id: 2710, name: "Greta Gerwig", nameJa: "グレタ・ガーウィグ", birthday: "08-04", birthYear: 1983, type: "director", knownFor: "バービー" },

    // 日本の俳優・監督
    { id: 1254, name: "Akira Kurosawa", nameJa: "黒澤明", birthday: "03-23", birthYear: 1910, deathYear: 1998, type: "director", knownFor: "七人の侍" },
    { id: 8857, name: "Hayao Miyazaki", nameJa: "宮崎駿", birthday: "01-05", birthYear: 1941, type: "director", knownFor: "千と千尋の神隠し" },
    { id: 3317, name: "Takeshi Kitano", nameJa: "北野武", birthday: "01-18", birthYear: 1947, type: "director", knownFor: "座頭市 / HANA-BI" },
    { id: 126963, name: "Hirokazu Koreeda", nameJa: "是枝裕和", birthday: "06-06", birthYear: 1962, type: "director", knownFor: "万引き家族" },
    { id: 84326, name: "Makoto Shinkai", nameJa: "新海誠", birthday: "02-09", birthYear: 1973, type: "director", knownFor: "君の名は。" },
    { id: 2280, name: "Ken Watanabe", nameJa: "渡辺謙", birthday: "10-21", birthYear: 1959, type: "actor", knownFor: "ラストサムライ" },
    { id: 17178, name: "Rinko Kikuchi", nameJa: "菊地凛子", birthday: "01-06", birthYear: 1981, type: "actor", knownFor: "バベル" },
    { id: 568333, name: "Masaki Suda", nameJa: "菅田将暉", birthday: "02-21", birthYear: 1993, type: "actor", knownFor: "あゝ、荒野" },

    // 追加の俳優（月のカバレッジを増やす）
    { id: 880, name: "Ben Affleck", nameJa: "ベン・アフレック", birthday: "08-15", type: "actor", knownFor: "アルゴ" },
    { id: 17052, name: "Emma Stone", nameJa: "エマ・ストーン", birthday: "11-06", type: "actor", knownFor: "ラ・ラ・ランド" },
    { id: 2963, name: "Nicolas Cage", nameJa: "ニコラス・ケイジ", birthday: "01-07", type: "actor", knownFor: "リービング・ラスベガス" },
    { id: 13240, name: "Mark Ruffalo", nameJa: "マーク・ラファロ", birthday: "11-22", type: "actor", knownFor: "アベンジャーズ" },
    { id: 16828, name: "Chris Evans", nameJa: "クリス・エヴァンス", birthday: "06-13", type: "actor", knownFor: "キャプテン・アメリカ" },
    { id: 17605, name: "Idris Elba", nameJa: "イドリス・エルバ", birthday: "09-06", type: "actor", knownFor: "マイティ・ソー" },
    { id: 6968, name: "Hugh Jackman", nameJa: "ヒュー・ジャックマン", birthday: "10-12", type: "actor", knownFor: "X-MEN" },
    { id: 3896, name: "Liam Neeson", nameJa: "リーアム・ニーソン", birthday: "06-07", type: "actor", knownFor: "96時間" },
    { id: 31, name: "Tom Hanks", nameJa: "トム・ハンクス", birthday: "07-09", type: "actor", knownFor: "フォレスト・ガンプ" },
    { id: 2888, name: "Will Smith", nameJa: "ウィル・スミス", birthday: "09-25", type: "actor", knownFor: "メン・イン・ブラック" },
    { id: 3894, name: "Christian Bale", nameJa: "クリスチャン・ベール", birthday: "01-30", type: "actor", knownFor: "ダークナイト" },
    { id: 368, name: "Reese Witherspoon", nameJa: "リース・ウィザースプーン", birthday: "03-22", type: "actor", knownFor: "キューティ・ブロンド" },
    { id: 118545, name: "Florence Pugh", nameJa: "フローレンス・ピュー", birthday: "01-03", type: "actor", knownFor: "ミッドサマー" },
    { id: 1136406, name: "Tom Holland", nameJa: "トム・ホランド", birthday: "06-01", type: "actor", knownFor: "スパイダーマン" },
    { id: 10990, name: "Ryan Gosling", nameJa: "ライアン・ゴズリング", birthday: "11-12", type: "actor", knownFor: "ラ・ラ・ランド" },
    { id: 1269, name: "Ryan Reynolds", nameJa: "ライアン・レイノルズ", birthday: "10-23", type: "actor", knownFor: "デッドプール" },
    { id: 73457, name: "Timothée Chalamet", nameJa: "ティモシー・シャラメ", birthday: "12-27", type: "actor", knownFor: "デューン" },
    { id: 1136405, name: "Anya Taylor-Joy", nameJa: "アニャ・テイラー＝ジョイ", birthday: "04-16", type: "actor", knownFor: "クイーンズ・ギャンビット" },
];

// 今日誕生日の人を取得
export const getTodayBirthdayPeople = (): BirthdayPerson[] => {
    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return FAMOUS_PEOPLE.filter(person => person.birthday === monthDay);
};

// 特定の日の誕生日の人を取得（テスト用）
export const getBirthdayPeopleForDate = (date: Date): BirthdayPerson[] => {
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return FAMOUS_PEOPLE.filter(person => person.birthday === monthDay);
};
