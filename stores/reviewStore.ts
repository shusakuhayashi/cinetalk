import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { ReviewTag } from '../types';

interface ReviewItem {
    id: string;
    movie_id: number;
    movie_title: string;
    rating: number;
    content: string;
    tags: ReviewTag[];
    watched_at?: string;
    created_at: string;
    user_id?: string;
}

interface ReviewState {
    reviews: ReviewItem[];
    isLoading: boolean;
    getReviewByMovieId: (movieId: number) => ReviewItem | undefined;
    fetchReviews: () => Promise<void>;
    addReview: (review: Omit<ReviewItem, 'id' | 'created_at'>) => Promise<void>;
    updateReview: (id: string, updates: Partial<ReviewItem>) => Promise<void>;
    deleteReview: (id: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
    reviews: [],
    isLoading: false,

    getReviewByMovieId: (movieId) => {
        return get().reviews.find((r) => r.movie_id === movieId);
    },

    fetchReviews: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isLoading: true });
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ reviews: data as ReviewItem[] });
        }
        set({ isLoading: false });
    },

    addReview: async (review) => {
        const { data: { user } } = await supabase.auth.getUser();

        // 楽観的更新（未ログインでもとりあえず表示されるように）
        const tempId = Date.now().toString();
        const newReview = {
            ...review,
            id: tempId,
            created_at: new Date().toISOString(),
            user_id: user?.id
        };

        set((state) => ({
            reviews: [newReview, ...state.reviews],
        }));

        if (!user) return; // 未ログインならここで終了（オンメモリのみ）

        const { data, error } = await supabase
            .from('reviews')
            .insert({
                movie_id: review.movie_id,
                movie_title: review.movie_title,
                rating: review.rating,
                content: review.content,
                tags: review.tags,
                watched_at: review.watched_at,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding review to Supabase:', error);
            // エラー時はロールバック（削除）
            set((state) => ({
                reviews: state.reviews.filter((r) => r.id !== tempId),
            }));
        } else if (data) {
            // ID更新
            set((state) => ({
                reviews: state.reviews.map((r) =>
                    r.id === tempId ? (data as ReviewItem) : r
                ),
            }));
        }
    },

    updateReview: async (id, updates) => {
        const { data: { user } } = await supabase.auth.getUser();

        set((state) => ({
            reviews: state.reviews.map((r) =>
                r.id === id ? { ...r, ...updates } : r
            ),
        }));

        if (!user) return;

        // IDが一時IDの場合はアップデートできない（本来は起きないはず）
        if (id.length < 10) return;

        const { error } = await supabase
            .from('reviews')
            .update({
                rating: updates.rating,
                content: updates.content,
                tags: updates.tags,
                // 他のフィールド更新が必要なら追加
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating review:', error);
        }
    },

    deleteReview: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();

        set((state) => ({
            reviews: state.reviews.filter((r) => r.id !== id),
        }));

        if (!user) return;
        if (id.length < 10) return;

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting review:', error);
        }
    },
}));
