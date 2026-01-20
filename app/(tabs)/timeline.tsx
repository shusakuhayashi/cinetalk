import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useSocialStore } from '../../stores/socialStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';

interface TimelineItem {
    id: string; // review id
    user: {
        id: string;
        username: string | null;
        avatar_url: string | null;
    };
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    rating: number;
    content: string;
    created_at: string;
}

export default function TimelineScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const { following, fetchFollowing } = useSocialStore();
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        // 初回ロード
        loadData(true);
    }, [user]);

    const loadData = async (isRefresh = false) => {
        if (loadingMore && !isRefresh) return;
        if (!hasMore && !isRefresh && !isRefresh) return; // 最初の!isRefreshは不要だが、念のため

        if (isRefresh) {
            setRefreshing(true);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            // 基準となる日時（これより古いデータを取得）
            const lastItem = isRefresh ? null : timeline[timeline.length - 1];
            const untilDate = lastItem ? new Date(lastItem.created_at) : new Date();

            // ---------------------------------------------------------
            // 1. ダミーデータ生成 (10件) - untilDateより前の日付で生成
            // ---------------------------------------------------------
            const DUMMY_USERNAMES = [
                'CinemaWalker', 'FilmNoir_99', 'GhibliStan', 'NolanBeliever', 'PopcornMonster',
                'ScreenWriterWannabe', 'TokyoDrifter', 'AnimeMaster', 'HollywoodDreamer', 'IndieFilmFan',
                'SciFiGeek', 'RomComLover', 'HorrorQueen', 'DocumentaryDigest', 'ClassicCinemaClub',
                'WeekendBinger', 'MidnightScreening', 'CriticInTraining', 'DirectorChair', 'SubtitleReader'
            ];

            const DUMMY_MOVIES = [
                { title: 'The Godfather', poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg' },
                { title: 'Pulp Fiction', poster_path: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg' },
                { title: 'Inception', poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
                { title: 'Spirited Away', poster_path: '/39wmItIWsg5sZMyRUKGx35Nr1nF.jpg' },
                { title: 'Parasite', poster_path: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
                { title: 'The Dark Knight', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
                { title: 'Interstellar', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
                { title: 'Your Name.', poster_path: '/q719jXXEzOoYaps6babgKnONONX.jpg' },
                { title: 'Avengers: Endgame', poster_path: '/or06FN3Dka5tukK1e9sl16pB3iy.jpg' },
                { title: 'La La Land', poster_path: '/uDO8zWDhfWzUYxV4z8leDyB8oTs.jpg' }
            ];

            const DUMMY_REVIEWS = [
                "この映画は間違いなく傑作です。冒頭のシーンから完全に引き込まれました。特に照明と色彩の使い方が素晴らしく、どのフレームを切り取っても絵画のようです。脚本も非常に練られていて、伏線回収が見事でした。ラストシーンは涙なしには見られません。俳優陣の演技も鬼気迫るものがあり、特に主演の表情の演技には圧倒されました。映画館で観て本当によかったと思います。サウンドトラックも素晴らしく、鑑賞後すぐにサントラをダウンロードしてしまいました。迷っている人は絶対に観るべきです！",
                "期待以上の作品でした！予告編を見た時は正直そこまで期待していなかったのですが、いい意味で裏切られました。ストーリーのテンポが良く、2時間があっという間に感じました。キャラクターの心理描写が丁寧で、感情移入しやすかったです。アクションシーンの迫力もすごく、IMAXで観る価値があると思います。ただ、中盤少しだけ中だるみを感じる部分もありましたが、クライマックスの展開ですべて帳消しになりました。友人や家族にも自信を持っておすすめできる一本です。",
                "個人的には今年ベスト級の映画。テーマが深く、見終わった後もしばらく考えさせられました。単なるエンターテインメントではなく、社会的なメッセージもしっかりと込められている点が素晴らしい。映像技術の進化にも驚かされました。CGと実写の境目が全くわからず、没入感が半端ないです。監督のこだわりが随所に感じられ、細部まで丁寧に作られているのが伝わってきます。もう一度映画館に足を運んで、細かい演出を確認したいと思わせるような作品でした。",
                "賛否両論ある作品だとは聞いていましたが、個人的には「あり」だと思います。確かに難解な部分はありますが、それを考察するのもこの映画の楽しみ方の一つではないでしょうか。映像美だけでも観る価値は十分あります。独特の世界観に酔いしれることができました。俳優たちのアンサンブルも見事で、緊張感のある掛け合いには息を呑みました。ただ、ハッピーエンドを期待している人には少し重すぎる内容かもしれません。心に余裕がある時に観ることをおすすめします。",
                "昔の名作を現代風にアレンジしたような雰囲気があり、ノスタルジーを感じつつも新鮮な気持ちで楽しめました。特に音楽の使い方が絶妙で、シーンごとの感情を効果的に盛り上げていました。主役の二人のケミストリーも最高で、見ていて応援したくなります。脚本に少しご都合主義な展開が見られましたが、それを補って余りある魅力がこの映画にはあります。デートムービーとしても最適だし、一人でじっくり映画の世界に浸るのも良いでしょう。素晴らしい映画体験でした。"
            ];

            const dummyData: TimelineItem[] = Array.from({ length: 10 }).map((_, i) => {
                const date = new Date(untilDate);
                // 1時間〜48時間前の範囲でランダムに時間を戻す
                date.setHours(date.getHours() - (Math.floor(Math.random() * 48) + 1));

                const movie = DUMMY_MOVIES[Math.floor(Math.random() * DUMMY_MOVIES.length)];
                const review = DUMMY_REVIEWS[Math.floor(Math.random() * DUMMY_REVIEWS.length)];
                const username = DUMMY_USERNAMES[Math.floor(Math.random() * DUMMY_USERNAMES.length)];
                const rating = (Math.floor(Math.random() * 30) + 20) / 10;

                // ユニークなIDを生成するためにsuffixをつける
                const uniqueSuffix = isRefresh ? `init-${i}` : `more-${Date.now()}-${i}`;
                const avatarUrl = `https://i.pravatar.cc/150?u=${username}`; // ユーザー名で固定化

                return {
                    id: `dummy-${uniqueSuffix}`,
                    user: {
                        id: `dummy-user-${username}`,
                        username: username,
                        avatar_url: avatarUrl,
                    },
                    movie_id: 550 + i, // リンク先は適当
                    movie_title: movie.title,
                    movie_poster: movie.poster_path,
                    rating: rating,
                    content: review,
                    created_at: date.toISOString(),
                };
            });

            // ---------------------------------------------------------
            // 2. 実データ取得
            // ---------------------------------------------------------
            let realData: TimelineItem[] = [];

            if (user) {
                const { data: follows } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', user.id);

                if (follows && follows.length > 0) {
                    const followingIds = follows.map(f => f.following_id);

                    const { data: reviews, error } = await supabase
                        .from('reviews')
                        .select(`
                            *,
                            profiles:user_id (
                                id,
                                username,
                                avatar_url
                            )
                        `)
                        .in('user_id', followingIds)
                        .lt('created_at', untilDate.toISOString()) // cursor
                        .order('created_at', { ascending: false })
                        .limit(10); // 10件取得

                    if (!error && reviews) {
                        realData = reviews.map((r: any) => ({
                            id: r.id,
                            user: {
                                id: r.profiles.id,
                                username: r.profiles.username || '名無しさん',
                                avatar_url: r.profiles.avatar_url
                            },
                            movie_id: r.movie_id,
                            movie_title: r.movie_title,
                            movie_poster: r.poster_path,
                            rating: r.rating,
                            content: r.content,
                            created_at: r.created_at
                        }));
                    }
                }
            }

            // ---------------------------------------------------------
            // 3. マージ & ソート
            // ---------------------------------------------------------
            const combined = [...realData, ...dummyData].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            if (isRefresh) {
                setTimeline(combined);
            } else {
                // 重複排除しつつ追加
                setTimeline(prev => {
                    const existingIds = new Set(prev.map(item => item.id));
                    const newItems = combined.filter(item => !existingIds.has(item.id));
                    return [...prev, ...newItems];
                });
            }

            // 何も取得できなかったら打ち止め（ダミーがあるのであんまりないが）
            if (combined.length === 0) {
                setHasMore(false);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    const handleRefresh = () => {
        loadData(true);
    };

    const handleLoadMore = () => {
        if (!loadingMore && !loading && hasMore) {
            loadData(false);
        }
    };

    const renderFooter = () => {
        if (!loadingMore) return <View style={{ height: 100 }} />; // スペーサー
        return (
            <View style={{ paddingVertical: 20, alignItems: 'center', marginBottom: 50 }}>
                <Text style={{ color: Colors.light.textMuted }}>読み込み中...</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: TimelineItem }) => (
        <TimelineCard item={item} />
    );

    return (
        <View style={styles.container}>
            <StaticHeader title="TIMELINE" />
            <FlatList
                data={timeline}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top + 10 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>まだ投稿がありません</Text>
                            <Text style={styles.hintText}>ユーザーをフォローして、レビューを見つけましょう！</Text>
                            <TouchableOpacity
                                style={styles.searchButton}
                                onPress={() => router.push('/search/users')}
                            >
                                <Text style={styles.searchButtonText}>ユーザーを探す</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

function TimelineCard({ item }: { item: TimelineItem }) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    // 長文判定（ボタン表示用）
    // 5行だとおおよそ100-150文字程度。文字数判定でボタンを出すか決める
    const isLongText = item.content.length > 100;

    return (
        <View style={styles.card}>
            {/* Header: User Info */}
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    {item.user.avatar_url ? (
                        <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.defaultAvatar]}>
                            <Ionicons name="person" size={16} color="#9ca3af" />
                        </View>
                    )}
                    <View>
                        <Text style={styles.username}>{item.user.username}</Text>
                        <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>
            </View>

            {/* Content: Movie & Review */}
            <View style={styles.cardContent}>
                <TouchableOpacity
                    style={styles.movieInfo}
                    onPress={() => router.push(`/movie/${item.movie_id}`)}
                >
                    {item.movie_poster && (
                        <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w200${item.movie_poster}` }}
                            style={styles.poster}
                        />
                    )}
                    <View style={styles.reviewContent}>
                        <Text style={styles.movieTitle}>{item.movie_title}</Text>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.star}>★</Text>
                            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Review Text Area */}
                <View style={styles.textContainer}>
                    <Text
                        style={styles.reviewText}
                        numberOfLines={expanded ? undefined : 5}
                    >
                        {item.content}
                    </Text>
                    {isLongText && !expanded && (
                        <TouchableOpacity style={styles.readMoreButton} onPress={() => setExpanded(true)}>
                            <Text style={styles.readMoreText}>続きを読む</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    defaultAvatar: {
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    date: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    cardContent: {

    },
    movieInfo: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    poster: {
        width: 50,
        height: 75,
        borderRadius: 4,
        marginRight: 12,
        backgroundColor: '#f0f0f0',
    },
    reviewContent: {
        flex: 1,
        justifyContent: 'center',
    },
    movieTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    star: {
        color: '#FFD700',
        fontSize: 14,
        marginRight: 2,
    },
    rating: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    textContainer: {
        marginTop: 0,
    },
    reviewText: {
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 22,
    },
    readMoreButton: {
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    readMoreText: {
        color: Colors.light.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    hintText: {
        fontSize: 14,
        color: Colors.light.textMuted,
        textAlign: 'center',
        marginBottom: 20,
    },
    searchButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
