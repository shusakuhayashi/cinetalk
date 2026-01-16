import { create } from 'zustand';
import { ReviewTag } from '../types';

interface ReviewItem {
    id: string;
    movie_id: number;
    movie_title: string;
    rating: number;
    content: string;
    tags: ReviewTag[];
    watched_at: string;
    created_at: string;
}

interface ReviewState {
    reviews: ReviewItem[];
    getReviewByMovieId: (movieId: number) => ReviewItem | undefined;
    addReview: (review: Omit<ReviewItem, 'id' | 'created_at'>) => void;
    updateReview: (id: string, updates: Partial<ReviewItem>) => void;
    deleteReview: (id: string) => void;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
    reviews: [],

    getReviewByMovieId: (movieId) => {
        return get().reviews.find((r) => r.movie_id === movieId);
    },

    addReview: (review) =>
        set((state) => ({
            reviews: [
                ...state.reviews,
                {
                    ...review,
                    id: Date.now().toString(),
                    created_at: new Date().toISOString(),
                },
            ],
        })),

    updateReview: (id, updates) =>
        set((state) => ({
            reviews: state.reviews.map((r) =>
                r.id === id ? { ...r, ...updates } : r
            ),
        })),

    deleteReview: (id) =>
        set((state) => ({
            reviews: state.reviews.filter((r) => r.id !== id),
        })),
}));
