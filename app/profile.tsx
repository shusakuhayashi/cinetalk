import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useReviewStore } from '../stores/reviewStore';
import { useMovieListStore } from '../stores/movieListStore';
import { useCalendarStore } from '../stores/calendarStore';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const { reviews } = useReviewStore();
    const { favorites, watchlist } = useMovieListStore();
    const { records } = useCalendarStore();

    const handleSignOut = async () => {
        if (Platform.OS === 'web') {
            if (window.confirm('ログアウトしますか？')) {
                await signOut();
                router.replace('/');
            }
        } else {
            Alert.alert(
                'ログアウト',
                'ログアウトしますか？',
                [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                        text: 'ログアウト',
                        style: 'destructive',
                        onPress: async () => {
                            await signOut();
                            router.replace('/');
                        }
                    }
                ]
            );
        }
    };

    if (!user) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <Text>ログインしていません</Text>
            </View>
        );
    }

    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>プロフィール</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ユーザー情報 */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image
                                source={{ uri: avatarUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.defaultAvatar]}>
                                <View style={styles.defaultAvatarHead} />
                                <View style={styles.defaultAvatarBody} />
                            </View>
                        )}
                    </View>
                    <Text style={styles.email}>{user.email}</Text>
                    <Text style={styles.uid}>ID: {user.id.slice(0, 8)}...</Text>
                </View>

                {/* 統計情報 */}
                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{reviews.length}</Text>
                        <Text style={styles.statLabel}>レビュー</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{favorites.length}</Text>
                        <Text style={styles.statLabel}>お気に入り</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{watchlist.length}</Text>
                        <Text style={styles.statLabel}>ウォッチリスト</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{records.length}</Text>
                        <Text style={styles.statLabel}>視聴記録</Text>
                    </View>
                </View>

                {/* メニュー */}
                <View style={styles.menuSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/search/users')}
                    >
                        <Text style={styles.menuText}>ユーザーを探す 🔍</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/settings/privacy')}
                    >
                        <Text style={styles.menuText}>プライバシー設定 🔒</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                        <Text style={[styles.menuText, { color: '#FF3B30' }]}>ログアウト</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 24,
        color: Colors.light.text,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    defaultAvatar: {
        backgroundColor: '#E1E1E1',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    defaultAvatarHead: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#9ca3af',
        marginBottom: 6,
    },
    defaultAvatarBody: {
        width: 60,
        height: 40,
        borderRadius: 30,
        backgroundColor: '#9ca3af',
        marginBottom: -18,
    },
    defaultAvatarText: { // 不要だが安全のため残すor削除
        display: 'none',
    },
    email: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    uid: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    statsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        paddingVertical: 20,
        borderRadius: 16,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    menuSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: Colors.light.border,
        marginHorizontal: 24,
    },
    version: {
        marginTop: 32,
        textAlign: 'center',
        color: Colors.light.textMuted,
        fontSize: 12,
    },
});
