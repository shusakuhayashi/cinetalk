import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { UserProfile } from '../types';

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: UserProfile | null) => void;
    setLoading: (loading: boolean) => void;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setLoading: (loading) => set({ isLoading: loading }),

    signIn: async (email, password) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                set({ isLoading: false });
                return { error: error.message };
            }
            if (data.user) {
                set({
                    user: {
                        id: data.user.id,
                        email: data.user.email || '',
                        display_name: data.user.user_metadata?.display_name || null,
                        avatar_url: data.user.user_metadata?.avatar_url || null,
                        created_at: data.user.created_at,
                    },
                    isAuthenticated: true,
                    isLoading: false,
                });
            }
            return { error: null };
        } catch (err) {
            set({ isLoading: false });
            return { error: '予期せぬエラーが発生しました' };
        }
    },

    signUp: async (email, password) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                set({ isLoading: false });
                return { error: error.message };
            }
            set({ isLoading: false });
            return { error: null };
        } catch (err) {
            set({ isLoading: false });
            return { error: '予期せぬエラーが発生しました' };
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },

    checkSession: async () => {
        set({ isLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                set({
                    user: {
                        id: session.user.id,
                        email: session.user.email || '',
                        display_name: session.user.user_metadata?.display_name || null,
                        avatar_url: session.user.user_metadata?.avatar_url || null,
                        created_at: session.user.created_at,
                    },
                    isAuthenticated: true,
                });
            }
        } catch (err) {
            console.error('Session check failed:', err);
        } finally {
            set({ isLoading: false });
        }
    },
}));
