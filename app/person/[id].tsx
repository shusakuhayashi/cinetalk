import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import {
    getPersonDetails,
    getPersonMovieCredits,
    getImageUrl,
    getMovieDetails,
    PersonDetails,
    PersonCredits,
} from '../../services/tmdb';
import { Movie } from '../../types';
import { MovieCard } from '../../components/MovieCard';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';

// 共演者/関連人物
interface RelatedPerson {
    id: number;
    name: string;
    profile_path: string | null;
    movies: number; // 共演回数
}

export default function PersonDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const [person, setPerson] = useState<PersonDetails | null>(null);
    const [credits, setCredits] = useState<PersonCredits | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPeople, setRelatedPeople] = useState<RelatedPerson[]>([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    const personId = Number(id);

    useEffect(() => {
        if (id) {
            fetchPersonData();
        }
    }, [id]);

    const fetchPersonData = async () => {
        try {
            const [details, movieCredits] = await Promise.all([
                getPersonDetails(personId),
                getPersonMovieCredits(personId),
            ]);
            setPerson(details);
            setCredits(movieCredits);

            // 関連人物を取得
            fetchRelatedPeople(movieCredits, details.known_for_department);
        } catch (error) {
            console.error('Failed to fetch person:', error);
        } finally {
            setLoading(false);
        }
    };

    // 共演者や同じ監督の作品から関連人物を抽出
    const fetchRelatedPeople = async (movieCredits: PersonCredits, department: string) => {
        setLoadingRelated(true);
        try {
            const movies = department === 'Directing'
                ? movieCredits.crew.filter(m => m.job === 'Director').slice(0, 5)
                : movieCredits.cast.slice(0, 5);

            const peopleMap = new Map<number, RelatedPerson>();

            // 上位5作品の共演者/クルーを取得
            for (const movie of movies) {
                try {
                    const details = await getMovieDetails(movie.id);
                    const relevantPeople = department === 'Directing'
                        ? details.credits?.cast?.slice(0, 5) || []
                        : [...(details.credits?.crew?.filter(c => c.job === 'Director') || []),
                        ...(details.credits?.cast?.slice(0, 10) || [])];

                    for (const p of relevantPeople) {
                        if (p.id !== personId) {
                            const existing = peopleMap.get(p.id);
                            if (existing) {
                                existing.movies += 1;
                            } else {
                                peopleMap.set(p.id, {
                                    id: p.id,
                                    name: p.name,
                                    profile_path: p.profile_path,
                                    movies: 1,
                                });
                            }
                        }
                    }
                } catch (e) {
                    // 個別エラーは無視
                }
            }

            // 共演回数順でソート
            const sorted = Array.from(peopleMap.values())
                .filter(p => p.profile_path)
                .sort((a, b) => b.movies - a.movies)
                .slice(0, 10);

            setRelatedPeople(sorted);
        } catch (error) {
            console.error('Failed to fetch related people:', error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const handleMoviePress = (movie: Movie) => {
        router.push(`/movie/${movie.id}`);
    };

    const handlePersonPress = (personId: number) => {
        router.push(`/person/${personId}`);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.accent} />
            </View>
        );
    }

    if (!person) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>人物が見つかりませんでした</Text>
            </View>
        );
    }

    const profileUrl = getImageUrl(person.profile_path, 'w342');

    // 出演作品を評価順でソート
    const actorMovies = (credits?.cast || [])
        .filter((m) => m.poster_path)
        .sort((a, b) => b.vote_average - a.vote_average);

    // 監督作品を取得
    const directorMovies = (credits?.crew || [])
        .filter((m) => m.job === 'Director' && m.poster_path)
        .sort((a, b) => b.vote_average - a.vote_average);

    // 代表作（評価上位3作品）- 映画オブジェクトとして保持
    const featuredMovies = (person.known_for_department === 'Directing' ? directorMovies : actorMovies)
        .slice(0, 3);

    const departmentLabel = person.known_for_department === 'Acting' ? '俳優' :
        person.known_for_department === 'Directing' ? '監督' :
            person.known_for_department;

    return (
        <View style={styles.screenContainer}>
            {/* 固定ヘッダー */}
            <StaticHeader title="シネマ管理くん〜 話、聞こか？ 〜" showBackButton />

            <ScrollView
                style={styles.container}
                bounces={false}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
            >
                {/* プロフィール */}
                <View style={styles.profileSection}>
                    <View style={styles.profileImageContainer}>
                        {profileUrl ? (
                            <Image source={{ uri: profileUrl }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.profilePlaceholder}>
                                <Text style={styles.profilePlaceholderText}>-</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.name}>{person.name}</Text>
                    <Text style={styles.department}>{departmentLabel}</Text>

                    {/* 代表作表示（タップ可能） */}
                    {featuredMovies.length > 0 && (
                        <View style={styles.featuredWorksContainer}>
                            <Text style={styles.featuredWorksLabel}>代表作</Text>
                            <View style={styles.featuredWorksList}>
                                {featuredMovies.map((movie, index) => (
                                    <TouchableOpacity
                                        key={movie.id}
                                        onPress={() => handleMoviePress(movie)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.featuredWorkLink}>
                                            {movie.title}{index < featuredMovies.length - 1 ? '、' : ''}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}


                    {/* 基本情報 */}
                    {person.birthday && (
                        <Text style={styles.birthInfo}>
                            {person.birthday}{person.place_of_birth && ` - ${person.place_of_birth}`}
                        </Text>
                    )}
                </View>

                {/* 経歴 */}
                {person.biography && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>PROFILE</Text>
                        <View style={styles.biographyCard}>
                            <Text style={styles.biography}>{person.biography}</Text>
                        </View>
                    </View>
                )}

                {/* 監督作品 */}
                {directorMovies.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>DIRECTING ({directorMovies.length})</Text>
                        <FlatList
                            data={directorMovies.slice(0, 20)}
                            renderItem={({ item }) => (
                                <MovieCard movie={item} onPress={handleMoviePress} size="small" />
                            )}
                            keyExtractor={(item) => `director-${item.id}`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.movieList}
                            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                        />
                    </View>
                )}

                {/* 出演作品 */}
                {actorMovies.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ACTING ({actorMovies.length})</Text>
                        <FlatList
                            data={actorMovies.slice(0, 20)}
                            renderItem={({ item }) => (
                                <MovieCard movie={item} onPress={handleMoviePress} size="small" />
                            )}
                            keyExtractor={(item) => `actor-${item.id}`}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.movieList}
                            ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                        />
                    </View>
                )}

                {/* 関連人物レコメンド */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        PEOPLE WHO MIGHT INTEREST YOU
                    </Text>
                    {loadingRelated ? (
                        <View style={styles.relatedLoading}>
                            <ActivityIndicator size="small" color={Colors.light.accent} />
                            <Text style={styles.relatedLoadingText}>分析中...</Text>
                        </View>
                    ) : relatedPeople.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
                            {relatedPeople.map((rp) => (
                                <TouchableOpacity
                                    key={rp.id}
                                    style={styles.relatedPerson}
                                    onPress={() => handlePersonPress(rp.id)}
                                    activeOpacity={0.7}
                                >
                                    {rp.profile_path ? (
                                        <Image
                                            source={{ uri: getImageUrl(rp.profile_path, 'w185')! }}
                                            style={styles.relatedImage}
                                        />
                                    ) : (
                                        <View style={[styles.relatedImage, styles.relatedPlaceholder]}>
                                            <Text style={styles.relatedPlaceholderText}>-</Text>
                                        </View>
                                    )}
                                    <Text style={styles.relatedName} numberOfLines={2}>{rp.name}</Text>
                                    <Text style={styles.relatedCount}>{rp.movies}作品で共演</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.noRelatedText}>関連人物を探しています...</Text>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    errorText: {
        color: Colors.light.textMuted,
        fontSize: 16,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 20,
        backgroundColor: Colors.light.surface,
    },
    profileImageContainer: {
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    profileImage: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: Colors.light.accent,
    },
    profilePlaceholder: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePlaceholderText: {
        fontSize: 44,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    department: {
        fontSize: 14,
        color: Colors.light.accent,
        fontWeight: '600',
        marginBottom: 12,
    },
    featuredWorksContainer: {
        backgroundColor: Colors.light.background,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 10,
        maxWidth: '100%',
    },
    featuredWorksLabel: {
        fontSize: 11,
        color: Colors.light.textMuted,
        marginBottom: 4,
    },
    featuredWorks: {
        fontSize: 13,
        color: Colors.light.primary,
        fontWeight: '500',
        textAlign: 'center',
    },
    featuredWorksList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
    },
    featuredWorkLink: {
        fontSize: 13,
        color: Colors.light.accent,
        fontWeight: '600',
        textDecorationLine: 'underline',
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    birthInfo: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.primary,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    biographyCard: {
        backgroundColor: Colors.light.surface,
        marginHorizontal: 16,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    biography: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.light.text,
    },
    movieList: {
        paddingHorizontal: 16,
    },
    relatedLoading: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 8,
    },
    relatedLoadingText: {
        color: Colors.light.textMuted,
        fontSize: 13,
    },
    relatedList: {
        paddingHorizontal: 16,
        gap: 12,
    },
    relatedPerson: {
        width: 80,
        alignItems: 'center',
    },
    relatedImage: {
        width: 65,
        height: 65,
        borderRadius: 33,
        marginBottom: 6,
    },
    relatedPlaceholder: {
        backgroundColor: Colors.light.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    relatedPlaceholderText: {
        fontSize: 24,
    },
    relatedName: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.light.primary,
        textAlign: 'center',
        lineHeight: 14,
    },
    relatedCount: {
        fontSize: 10,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    noRelatedText: {
        color: Colors.light.textMuted,
        fontSize: 13,
        paddingHorizontal: 16,
    },
    bottomSpacer: {
        height: 40,
    },
});
