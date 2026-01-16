import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SSR時はAsyncStorageを使わない
const createSupabaseClient = (): SupabaseClient => {
    // サーバーサイド（SSR）の場合
    if (typeof window === 'undefined') {
        return createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
                detectSessionInUrl: false,
            },
        });
    }

    // クライアントサイドの場合
    // AsyncStorageを動的にインポート
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
};

export const supabase = createSupabaseClient();
