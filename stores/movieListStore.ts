import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface MovieItem {
    id: string;
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    added_at: string;
    user_id?: string;
}

interface MovieListState {
    favorites: MovieItem[];
    watchlist: MovieItem[];
    isLoading: boolean;

    isFavorite: (movieId: number) => boolean;
    isInWatchlist: (movieId: number) => boolean;

    fetchLists: () => Promise<void>;

    addFavorite: (item: Omit<MovieItem, 'id' | 'added_at'>) => Promise<void>;
    removeFavorite: (movieId: number) => Promise<void>;
    toggleFavorite: (item: Omit<MovieItem, 'id' | 'added_at'>) => Promise<boolean>;

    addToWatchlist: (item: Omit<MovieItem, 'id' | 'added_at'>) => Promise<void>;
    removeFromWatchlist: (movieId: number) => Promise<void>;
    toggleWatchlist: (item: Omit<MovieItem, 'id' | 'added_at'>) => Promise<boolean>;
}

export const useMovieListStore = create<MovieListState>((set, get) => ({
    favorites: [],
    watchlist: [],
    isLoading: false,

    isFavorite: (movieId) => {
        return get().favorites.some((f) => f.movie_id === movieId);
    },

    isInWatchlist: (movieId) => {
        return get().watchlist.some((w) => w.movie_id === movieId);
    },

    fetchLists: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isLoading: true });

        // 並行取得
        const [favRes, watchRes] = await Promise.all([
            supabase.from('favorites').select('*').order('created_at', { ascending: false }),
            supabase.from('watchlist').select('*').order('created_at', { ascending: false })
        ]);

        if (favRes.data) set({ favorites: favRes.data as MovieItem[] });
        if (watchRes.data) set({ watchlist: watchRes.data as MovieItem[] });

        set({ isLoading: false });
    },

    addFavorite: async (item) => {
        const { data: { user } } = await supabase.auth.getUser();

        const tempId = Date.now().toString();
        const newItem = {
            ...item,
            id: tempId,
            added_at: new Date().toISOString(),
            user_id: user?.id
        };

        set((state) => ({
            favorites: [newItem, ...state.favorites],
        }));

        if (!user) return;

        const { data, error } = await supabase
            .from('favorites')
            .insert({
                movie_id: item.movie_id,
                movie_title: item.movie_title,
                movie_poster: item.movie_poster,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding favorite:', error);
            set((state) => ({
                favorites: state.favorites.filter((f) => f.id !== tempId),
            }));
        } else if (data) {
            set((state) => ({
                favorites: state.favorites.map((f) =>
                    f.id === tempId ? (data as MovieItem) : f
                ),
            }));
        }
    },

    removeFavorite: async (movieId) => {
        const { data: { user } } = await supabase.auth.getUser();

        set((state) => ({
            favorites: state.favorites.filter((f) => f.movie_id !== movieId),
        }));

        if (!user) return;

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('movie_id', movieId)
            .eq('user_id', user.id); // 自分のデータのみ削除

        if (error) {
            console.error('Error removing favorite:', error);
        }
    },

    toggleFavorite: async (item) => {
        const isFav = get().isFavorite(item.movie_id);
        if (isFav) {
            await get().removeFavorite(item.movie_id);
            return false;
        } else {
            await get().addFavorite(item);
            return true;
        }
    },

    addToWatchlist: async (item) => {
        const { data: { user } } = await supabase.auth.getUser();

        const tempId = Date.now().toString();
        const newItem = {
            ...item,
            id: tempId,
            added_at: new Date().toISOString(),
            user_id: user?.id
        };

        set((state) => ({
            watchlist: [newItem, ...state.watchlist],
        }));

        if (!user) return;

        const { data, error } = await supabase
            .from('watchlist')
            .insert({
                movie_id: item.movie_id,
                movie_title: item.movie_title,
                movie_poster: item.movie_poster,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding watchlist:', error);
            set((state) => ({
                watchlist: state.watchlist.filter((w) => w.id !== tempId),
            }));
        } else if (data) {
            set((state) => ({
                watchlist: state.watchlist.map((w) =>
                    w.id === tempId ? (data as MovieItem) : w
                ),
            }));
        }
    },

    removeFromWatchlist: async (movieId) => {
        const { data: { user } } = await supabase.auth.getUser();

        set((state) => ({
            watchlist: state.watchlist.filter((w) => w.movie_id !== movieId),
        }));

        if (!user) return;

        const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('movie_id', movieId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error removing watchlist:', error);
        }
    },

    toggleWatchlist: async (item) => {
        const isInList = get().isInWatchlist(item.movie_id);
        if (isInList) {
            await get().removeFromWatchlist(item.movie_id);
            return false;
        } else {
            await get().addToWatchlist(item);
            return true;
        }
    },
}));
