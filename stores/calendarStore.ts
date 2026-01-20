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
    user_id?: string;
}

interface CalendarState {
    records: WatchRecord[];
    selectedDate: string;
    isLoading: boolean;
    setSelectedDate: (date: string) => void;
    addRecord: (record: Omit<WatchRecord, 'id'>) => Promise<void>;
    removeRecord: (id: string) => Promise<void>;
    getRecordsByMonth: (year: number, month: number) => WatchRecord[];
    fetchRecords: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    records: [],
    selectedDate: new Date().toISOString().split('T')[0],
    isLoading: false,

    setSelectedDate: (date) => set({ selectedDate: date }),

    fetchRecords: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ isLoading: true });
        const { data, error } = await supabase
            .from('calendar_records')
            .select('*')
            .order('watched_at', { ascending: false });

        if (!error && data) {
            set({ records: data as WatchRecord[] });
        }
        set({ isLoading: false });
    },

    addRecord: async (record) => {
        const { data: { user } } = await supabase.auth.getUser();

        const tempId = Date.now().toString();
        const newRecord = { ...record, id: tempId, user_id: user?.id };

        set((state) => ({
            records: [...state.records, newRecord],
        }));

        if (!user) return;

        const { data, error } = await supabase
            .from('calendar_records')
            .insert({
                movie_id: record.movie_id,
                movie_title: record.movie_title,
                movie_poster: record.movie_poster,
                rating: record.rating,
                notes: record.notes,
                watched_at: record.watched_at,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding calendar record:', error);
            set((state) => ({
                records: state.records.filter((r) => r.id !== tempId),
            }));
        } else if (data) {
            set((state) => ({
                records: state.records.map((r) =>
                    r.id === tempId ? (data as WatchRecord) : r
                ),
            }));
        }
    },

    removeRecord: async (id) => {
        const { data: { user } } = await supabase.auth.getUser();

        set((state) => ({
            records: state.records.filter((r) => r.id !== id),
        }));

        if (!user) return;
        if (id.length < 10) return;

        const { error } = await supabase
            .from('calendar_records')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error removing calendar record:', error);
        }
    },

    getRecordsByMonth: (year, month) => {
        const records = get().records;
        return records.filter((r) => {
            const date = new Date(r.watched_at);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    },
}));
