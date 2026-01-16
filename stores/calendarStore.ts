import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface WatchRecord {
    id: string;
    movie_id: number;
    movie_title: string;
    movie_poster: string | null;
    watched_at: string;
    rating?: number;
    notes?: string;
}

interface CalendarState {
    records: WatchRecord[];
    selectedDate: string;
    isLoading: boolean;
    setSelectedDate: (date: string) => void;
    addRecord: (record: Omit<WatchRecord, 'id'>) => void;
    removeRecord: (id: string) => void;
    getRecordsByMonth: (year: number, month: number) => WatchRecord[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    records: [],
    selectedDate: new Date().toISOString().split('T')[0],
    isLoading: false,

    setSelectedDate: (date) => set({ selectedDate: date }),

    addRecord: (record) =>
        set((state) => ({
            records: [
                ...state.records,
                { ...record, id: Date.now().toString() },
            ],
        })),

    removeRecord: (id) =>
        set((state) => ({
            records: state.records.filter((r) => r.id !== id),
        })),

    getRecordsByMonth: (year, month) => {
        const records = get().records;
        return records.filter((r) => {
            const date = new Date(r.watched_at);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    },
}));
