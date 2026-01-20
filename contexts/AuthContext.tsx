import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useReviewStore } from '../stores/reviewStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useMovieListStore } from '../stores/movieListStore';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // ストアのデータ同期
    const syncData = async (user: User | null) => {
        if (user) {
            await Promise.all([
                useReviewStore.getState().fetchReviews(),
                useCalendarStore.getState().fetchRecords(),
                useMovieListStore.getState().fetchLists(),
            ]);
        }
    };

    useEffect(() => {
        // URLからのセッション復元処理
        const handleDeepLink = async (url: string) => {
            try {
                // URLにハッシュ(#)またはクエリ(?)が含まれているか確認
                if (!url || (!url.includes('#') && !url.includes('?'))) return;

                // パラメータを抽出
                const text = url.split('#')[1] || url.split('?')[1];
                if (!text) return;

                const params = new URLSearchParams(text);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (error) throw error;

                    // セッション設定成功後、データ同期
                    if (data.session?.user) {
                        syncData(data.session.user);
                    }
                }
            } catch (error) {
                console.error('Deep link handling error:', error);
            }
        };

        // 初期起動時のURLチェック
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        // アプリ起動中のURLイベント監視
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // 通常のセッション取得
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            syncData(session?.user ?? null);
        });

        // 認証状態の変更を監視
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const currentUser = session?.user ?? null;
                setSession(session);
                setUser(currentUser);
                setLoading(false);
                syncData(currentUser);
            }
        );

        return () => {
            subscription.remove();
            authSubscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// カスタムフック: 認証情報の利用
export function useAuth() {
    return useContext(AuthContext);
}
