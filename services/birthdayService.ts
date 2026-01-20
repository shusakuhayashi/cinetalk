// 誕生日データ自動取得サービス
// TMDb APIから人気俳優を取得し、誕生日でフィルタリング

import AsyncStorage from '@react-native-async-storage/async-storage';

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = process.env.EXPO_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';

// 共通のfetchオプション（tmdb.tsと同じ方式）
const fetchOptions = {
    headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'Content-Type': 'application/json',
    },
};

// キャッシュキー
const CACHE_KEY = 'birthday_people_cache';
const CACHE_EXPIRY_KEY = 'birthday_people_cache_expiry';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7日間

export interface BirthdayPersonData {
    id: number;
    name: string;
    nameJa?: string;
    birthday: string; // YYYY-MM-DD or MM-DD
    profilePath: string | null;
    knownForDepartment: string;
    popularity: number;
}

interface TMDbPersonDetail {
    id: number;
    name: string;
    birthday: string | null;
    profile_path: string | null;
    known_for_department: string;
    popularity: number;
}

interface TMDbPopularPeopleResponse {
    results: {
        id: number;
        name: string;
        profile_path: string | null;
        known_for_department: string;
        popularity: number;
    }[];
    total_pages: number;
}

// 人気俳優を取得（複数ページ）
async function fetchPopularPeople(pages: number = 20): Promise<number[]> {
    const personIds: number[] = [];

    for (let page = 1; page <= pages; page++) {
        try {
            const response = await fetch(
                `${TMDB_BASE_URL}/person/popular?language=ja-JP&page=${page}`,
                fetchOptions
            );

            if (!response.ok) {
                console.error(`API error on page ${page}: ${response.status}`);
                continue;
            }

            const data: TMDbPopularPeopleResponse = await response.json();

            if (data.results && Array.isArray(data.results)) {
                data.results.forEach((person) => {
                    personIds.push(person.id);
                });
            }

            // レート制限対策
            if (page % 5 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
        }
    }

    return personIds;
}

// 個々の人物の詳細を取得
async function fetchPersonDetail(personId: number): Promise<BirthdayPersonData | null> {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/person/${personId}?language=ja-JP`,
            fetchOptions
        );

        if (!response.ok) {
            return null;
        }

        const data: TMDbPersonDetail = await response.json();

        if (!data.birthday) {
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            birthday: data.birthday,
            profilePath: data.profile_path,
            knownForDepartment: data.known_for_department,
            popularity: data.popularity,
        };
    } catch (error) {
        console.error(`Error fetching person ${personId}:`, error);
        return null;
    }
}

// キャッシュからデータを取得
async function getCachedData(): Promise<BirthdayPersonData[] | null> {
    try {
        const expiryStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
        if (!expiryStr) return null;

        const expiry = parseInt(expiryStr, 10);
        if (Date.now() > expiry) {
            // キャッシュ期限切れ
            await AsyncStorage.removeItem(CACHE_KEY);
            await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
            return null;
        }

        const cachedData = await AsyncStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;

        return JSON.parse(cachedData);
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

// データをキャッシュに保存
async function setCachedData(data: BirthdayPersonData[]): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        await AsyncStorage.setItem(
            CACHE_EXPIRY_KEY,
            (Date.now() + CACHE_DURATION_MS).toString()
        );
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

// メイン: 誕生日データを取得（キャッシュ優先）
export async function fetchBirthdayPeopleData(): Promise<BirthdayPersonData[]> {
    // キャッシュ確認
    const cached = await getCachedData();
    if (cached && cached.length > 0) {
        console.log(`Using cached birthday data (${cached.length} people)`);
        return cached;
    }

    console.log('Fetching birthday data from TMDb API...');

    // 人気俳優のIDを取得（20ページ = 約400人）
    const personIds = await fetchPopularPeople(20);
    console.log(`Found ${personIds.length} popular people`);

    // 各人物の詳細を取得
    const peopleData: BirthdayPersonData[] = [];
    const batchSize = 10;

    for (let i = 0; i < personIds.length; i += batchSize) {
        const batch = personIds.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(fetchPersonDetail));

        results.forEach((person) => {
            if (person) {
                peopleData.push(person);
            }
        });

        // レート制限対策
        if (i % 50 === 0 && i > 0) {
            console.log(`Fetched ${i}/${personIds.length} people...`);
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    console.log(`Total people with birthdays: ${peopleData.length}`);

    // キャッシュに保存
    await setCachedData(peopleData);

    return peopleData;
}

// 今日誕生日の人を取得
export async function getTodayBirthdayPeopleFromAPI(): Promise<BirthdayPersonData[]> {
    const allPeople = await fetchBirthdayPeopleData();

    const today = new Date();
    const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
    ).padStart(2, '0')}`;

    // YYYY-MM-DD形式の誕生日から月日を抽出してマッチング
    const todayPeople = allPeople.filter((person) => {
        if (!person.birthday) return false;
        const birthdayMonthDay = person.birthday.slice(5); // "YYYY-MM-DD" → "MM-DD"
        return birthdayMonthDay === monthDay;
    });

    // 人気順でソート
    return todayPeople.sort((a, b) => b.popularity - a.popularity);
}

// 特定の日付の誕生日の人を取得
export async function getBirthdayPeopleForDateFromAPI(
    date: Date
): Promise<BirthdayPersonData[]> {
    const allPeople = await fetchBirthdayPeopleData();

    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`;

    const matchingPeople = allPeople.filter((person) => {
        if (!person.birthday) return false;
        const birthdayMonthDay = person.birthday.slice(5);
        return birthdayMonthDay === monthDay;
    });

    return matchingPeople.sort((a, b) => b.popularity - a.popularity);
}

// キャッシュをクリア
export async function clearBirthdayCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_EXPIRY_KEY);
    console.log('Birthday cache cleared');
}

// キャッシュの状態を取得
export async function getCacheStatus(): Promise<{
    exists: boolean;
    expiresAt: Date | null;
    peopleCount: number;
}> {
    try {
        const expiryStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
        const cachedData = await AsyncStorage.getItem(CACHE_KEY);

        if (!expiryStr || !cachedData) {
            return { exists: false, expiresAt: null, peopleCount: 0 };
        }

        const data = JSON.parse(cachedData);
        return {
            exists: true,
            expiresAt: new Date(parseInt(expiryStr, 10)),
            peopleCount: data.length,
        };
    } catch {
        return { exists: false, expiresAt: null, peopleCount: 0 };
    }
}
