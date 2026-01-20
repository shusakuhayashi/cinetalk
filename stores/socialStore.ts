import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface UserProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_private: boolean;
    is_following?: boolean; // 自分がフォローしているか
}

interface SocialState {
    following: UserProfile[]; // フォロー中のユーザー
    followers: UserProfile[]; // フォロワー
    searchResults: UserProfile[]; // 検索結果
    timeline: any[]; // タイムライン（レビュー等）
    isLoading: boolean;

    // アクション
    searchUsers: (query: string) => Promise<void>;
    followUser: (userId: string) => Promise<void>;
    unfollowUser: (userId: string) => Promise<void>;
    fetchFollowing: () => Promise<void>;
    fetchFollowers: () => Promise<void>;
    checkIfFollowing: (userId: string) => Promise<boolean>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
    following: [],
    followers: [],
    searchResults: [],
    timeline: [],
    isLoading: false,

    // ユーザー検索
    searchUsers: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [] });
            return;
        }

        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();

        // emailの部分一致などで検索（実際はusernameやprofilesテーブル検索が良い）
        // ここではprofilesテーブルのusernameまたはemail(auth側は検索できないのでprofilesのみ)を検索
        // ※profilesにusernameがある前提

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${query}%`)
                .limit(20);

            if (data) {
                // 自分のフォロー状態を確認してマージ
                // (実装簡略化のため一旦そのままセット、後で改善可)
                const results = data.filter(p => p.id !== user?.id) as UserProfile[];
                set({ searchResults: results });
            }
        } catch (e) {
            console.error(e);
        } finally {
            set({ isLoading: false });
        }
    },

    // フォローする
    followUser: async (targetUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        set(state => ({
            searchResults: state.searchResults.map(p =>
                p.id === targetUserId ? { ...p, is_following: true } : p
            )
        }));

        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: targetUserId
            });

        if (error) {
            console.error('Follow error:', error);
            // Rollback
            set(state => ({
                searchResults: state.searchResults.map(p =>
                    p.id === targetUserId ? { ...p, is_following: false } : p
                )
            }));
        } else {
            // リスト更新
            get().fetchFollowing();
        }
    },

    // フォロー解除
    unfollowUser: async (targetUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        set(state => ({
            following: state.following.filter(p => p.id !== targetUserId),
            searchResults: state.searchResults.map(p =>
                p.id === targetUserId ? { ...p, is_following: false } : p
            )
        }));

        const { error } = await supabase
            .from('follows')
            .delete()
            .match({
                follower_id: user.id,
                following_id: targetUserId
            });

        if (error) {
            console.error('Unfollow error:', error);
            // Rollback (fetchし直すのが確実)
            get().fetchFollowing();
        }
    },

    // フォロー一覧取得
    fetchFollowing: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('follows')
            .select(`
                following_id,
                profiles:following_id (*)
            `)
            .eq('follower_id', user.id);

        if (data) {
            // profiles型に合わせて整形
            const following = data.map((item: any) => ({
                ...item.profiles,
                is_following: true
            }));
            set({ following });
        }
    },

    // フォロワー一覧取得
    fetchFollowers: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('follows')
            .select(`
                follower_id,
                profiles:follower_id (*)
            `)
            .eq('following_id', user.id);

        if (data) {
            const followers = data.map((item: any) => item.profiles);
            set({ followers });
        }
    },

    checkIfFollowing: async (userId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data } = await supabase
            .from('follows')
            .select('*')
            .match({
                follower_id: user.id,
                following_id: userId
            })
            .single();

        return !!data;
    }
}));
