import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useState, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useCalendarStore } from '../../stores/calendarStore';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';

const { width } = Dimensions.get('window');
const DAYS = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function CalendarScreen() {
    const insets = useSafeAreaInsets();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { records, selectedDate, setSelectedDate } = useCalendarStore();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // カレンダーの日付を生成
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const days: (number | null)[] = [];

        // 前月の空白
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // 今月の日付
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [currentYear, currentMonth]);

    // 選択された日付の記録を取得
    const selectedRecords = useMemo(() => {
        return records.filter((r) => {
            const date = new Date(r.watched_at);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return dateStr === selectedDate;
        });
    }, [records, selectedDate]);

    // 日付に記録があるかチェック
    const hasRecord = (day: number) => {
        const targetDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return records.some((r) => {
            const date = new Date(r.watched_at);
            const recordDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return recordDateStr === targetDateStr;
        });
    };

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const today = new Date();
    const isToday = (day: number) =>
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

    return (
        <View style={styles.container}>
            {/* 固定ヘッダー */}
            <StaticHeader title="WATCH LOG" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
            >
                {/* 月選択ヘッダー */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {currentYear}年 {MONTHS[currentMonth]}
                    </Text>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <Text style={styles.navButtonText}>▶</Text>
                    </TouchableOpacity>
                </View>

                {/* 曜日ヘッダー */}
                <View style={styles.weekHeader}>
                    {DAYS.map((day, index) => (
                        <View key={day} style={styles.weekDay}>
                            <Text
                                style={[
                                    styles.weekDayText,
                                    index === 0 && styles.sundayText,
                                    index === 6 && styles.saturdayText,
                                ]}
                            >
                                {day}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* カレンダーグリッド */}
                <View style={styles.calendarGrid}>
                    {calendarDays.map((day, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayCell,
                                day && isToday(day) ? styles.todayCell : undefined,
                                day &&
                                    selectedDate ===
                                    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                    ? styles.selectedCell : undefined,
                            ]}
                            onPress={() => day && handleDayPress(day)}
                            disabled={!day}
                        >
                            {day && (
                                <>
                                    <Text
                                        style={[
                                            styles.dayText,
                                            index % 7 === 0 && styles.sundayText,
                                            index % 7 === 6 && styles.saturdayText,
                                            isToday(day) && styles.todayText,
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                    {hasRecord(day) && <View style={styles.recordDot} />}
                                </>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 選択日の記録 */}
                <View style={styles.recordsSection}>
                    <Text style={styles.recordsTitle}>
                        {selectedDate}
                    </Text>
                    {selectedRecords.length > 0 ? (
                        selectedRecords.map((record) => (
                            <View key={record.id} style={styles.recordItem}>
                                <Text style={styles.recordMovieTitle}>{record.movie_title}</Text>
                                {record.rating && (
                                    <Text style={styles.recordRating}>
                                        {'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}
                                    </Text>
                                )}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyRecord}>
                            <Text style={styles.emptyRecordText}>
                                この日の鑑賞記録はありません
                            </Text>
                            <Text style={styles.emptyRecordHint}>
                                映画を見たら記録しましょう！
                            </Text>
                        </View>
                    )}
                </View>

                {/* 統計 */}
                <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>MONTHLY STATS</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {records.filter((r) => {
                                    const date = new Date(r.watched_at);
                                    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
                                }).length}
                            </Text>
                            <Text style={styles.statLabel}>本</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: Colors.light.surface,
    },
    navButton: {
        padding: 10,
    },
    navButtonText: {
        fontSize: 18,
        color: Colors.light.accent,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    weekHeader: {
        flexDirection: 'row',
        backgroundColor: Colors.light.surface,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    weekDay: {
        flex: 1,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.textMuted,
    },
    sundayText: {
        color: '#E74C3C',
    },
    saturdayText: {
        color: '#3498DB',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        backgroundColor: Colors.light.surface,
    },
    dayCell: {
        width: '14.28%',
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    todayCell: {
        backgroundColor: Colors.light.accent + '20',
        borderRadius: 25,
    },
    selectedCell: {
        backgroundColor: Colors.light.accent,
        borderRadius: 25,
    },
    dayText: {
        fontSize: 16,
        color: Colors.light.primary,
    },
    todayText: {
        fontWeight: '700',
    },
    recordDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.light.accent,
        marginTop: 2,
    },
    recordsSection: {
        margin: 20,
        padding: 20,
        backgroundColor: Colors.light.surface,
        borderRadius: 16,
    },
    recordsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 16,
    },
    recordItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    recordMovieTitle: {
        fontSize: 15,
        color: Colors.light.text,
        flex: 1,
    },
    recordRating: {
        fontSize: 14,
        color: '#FFD700',
    },
    emptyRecord: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyRecordText: {
        fontSize: 14,
        color: Colors.light.textMuted,
        marginBottom: 4,
    },
    emptyRecordHint: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    statsSection: {
        margin: 20,
        marginTop: 0,
        padding: 20,
        backgroundColor: Colors.light.surface,
        borderRadius: 16,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.primary,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statNumber: {
        fontSize: 48,
        fontWeight: '700',
        color: Colors.light.accent,
    },
    statLabel: {
        fontSize: 18,
        color: Colors.light.textMuted,
        marginLeft: 8,
    },
});
