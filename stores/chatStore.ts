import { create } from 'zustand';
import { ChatMessage, Movie } from '../types';

interface SelectedMovie {
    id: number;
    title: string;
    originalTitle: string;
    posterPath: string | null;
    genres: string[];
    directors: string[];
    cast: string[];
    overview: string;
    releaseDate: string;
    voteAverage: number;
}

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    selectedMovie: SelectedMovie | null;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    setLoading: (loading: boolean) => void;
    setSelectedMovie: (movie: SelectedMovie | null) => void;
    clearMessages: () => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    selectedMovie: null,

    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                },
            ],
        })),

    setLoading: (loading) => set({ isLoading: loading }),

    setSelectedMovie: (movie) => set({ selectedMovie: movie }),

    clearMessages: () => set({ messages: [] }),

    clearChat: () => set({ messages: [], selectedMovie: null }),
}));
