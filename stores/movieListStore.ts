import { create } from 'zustand';

interface FavoriteItem {
    id: string;
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    added_at: string;
}

interface WatchlistItem {
    id: string;
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    added_at: string;
}

interface MovieListState {
    favorites: FavoriteItem[];
    watchlist: WatchlistItem[];
    isFavorite: (movieId: number) => boolean;
    isInWatchlist: (movieId: number) => boolean;
    addFavorite: (item: Omit<FavoriteItem, 'id' | 'added_at'>) => void;
    removeFavorite: (movieId: number) => void;
    toggleFavorite: (item: Omit<FavoriteItem, 'id' | 'added_at'>) => boolean; // true if added, false if removed
    addToWatchlist: (item: Omit<WatchlistItem, 'id' | 'added_at'>) => void;
    removeFromWatchlist: (movieId: number) => void;
    toggleWatchlist: (item: Omit<WatchlistItem, 'id' | 'added_at'>) => boolean;
}

export const useMovieListStore = create<MovieListState>((set, get) => ({
    favorites: [],
    watchlist: [],

    isFavorite: (movieId) => {
        return get().favorites.some((f) => f.movie_id === movieId);
    },

    isInWatchlist: (movieId) => {
        return get().watchlist.some((w) => w.movie_id === movieId);
    },

    addFavorite: (item) =>
        set((state) => ({
            favorites: [
                ...state.favorites,
                {
                    ...item,
                    id: Date.now().toString(),
                    added_at: new Date().toISOString(),
                },
            ],
        })),

    removeFavorite: (movieId) =>
        set((state) => ({
            favorites: state.favorites.filter((f) => f.movie_id !== movieId),
        })),

    toggleFavorite: (item) => {
        const isFav = get().isFavorite(item.movie_id);
        if (isFav) {
            get().removeFavorite(item.movie_id);
            return false;
        } else {
            get().addFavorite(item);
            return true;
        }
    },

    addToWatchlist: (item) =>
        set((state) => ({
            watchlist: [
                ...state.watchlist,
                {
                    ...item,
                    id: Date.now().toString(),
                    added_at: new Date().toISOString(),
                },
            ],
        })),

    removeFromWatchlist: (movieId) =>
        set((state) => ({
            watchlist: state.watchlist.filter((w) => w.movie_id !== movieId),
        })),

    toggleWatchlist: (item) => {
        const isInList = get().isInWatchlist(item.movie_id);
        if (isInList) {
            get().removeFromWatchlist(item.movie_id);
            return false;
        } else {
            get().addToWatchlist(item);
            return true;
        }
    },
}));

