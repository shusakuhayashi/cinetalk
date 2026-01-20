import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useSocialStore } from '../../stores/socialStore';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function UserSearchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { searchUsers, followUser, unfollowUser, searchResults, isLoading, fetchFollowing } = useSocialStore();
    const [query, setQuery] = useState('');

    // 初回ロード時にフォローリストを取得（状態同期のため）
    useEffect(() => {
        fetchFollowing();
    }, []);

    const handleSearch = () => {
        searchUsers(query);
    };

    const handleToggleFollow = async (userId: string, isFollowing: boolean) => {
        if (isFollowing) {
            await unfollowUser(userId);
        } else {
            await followUser(userId);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        // 自分自身は検索結果に出てもフォローボタンを出さない（あるいはフィルタリングすべきだが）
        const isMe = item.id === currentUser?.id;
        const avatarUrl = item.avatar_url || item.picture;

        return (
            <View style={styles.userItem}>
                <View style={styles.userInfo}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.defaultAvatar]}>
                            <Ionicons name="person" size={20} color="#9ca3af" />
                        </View>
                    )}
                    <View style={styles.textContainer}>
                        <Text style={styles.username}>{item.username || '名無しさん'}</Text>
                        <Text style={styles.userId}>ID: {item.id.slice(0, 8)}...</Text>
                    </View>
                </View>

                {!isMe && (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            item.is_following && styles.followingButton
                        ]}
                        onPress={() => handleToggleFollow(item.id, !!item.is_following)}
                    >
                        <Text style={[
                            styles.followButtonText,
                            item.is_following && styles.followingButtonText
                        ]}>
                            {item.is_following ? 'フォロー中' : 'フォロー'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ユーザー検索</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 検索バー */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color={Colors.light.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="ユーザー名で検索..."
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* 結果リスト */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.light.primary} />
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        query.trim() ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>ユーザーが見つかりませんでした</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.hintText}>ユーザー名を入力して検索してください</Text>
                            </View>
                        )
                    }
                />
            )}
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
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    defaultAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 2,
    },
    userId: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    followButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    followButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    followingButtonText: {
        color: Colors.light.text,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.textMuted,
    },
    hintText: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
});
