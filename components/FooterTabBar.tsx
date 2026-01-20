import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface FooterTabBarProps {
    activeTab?: 'home' | 'log';
}

export const FooterTabBar: React.FC<FooterTabBarProps> = ({ activeTab }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 8, height: 64 + insets.bottom }]}>
            <TouchableOpacity
                style={styles.tab}
                onPress={() => router.replace('/')}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'home' && styles.tabTextActive
                ]}>HOME</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.tab}
                onPress={() => router.replace('/calendar')}
            >
                <Text style={[
                    styles.tabText,
                    activeTab === 'log' && styles.tabTextActive
                ]}>LOG</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.light.tabBg,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 9,
        fontWeight: '500',
        letterSpacing: 1,
        color: Colors.light.textMuted,
    },
    tabTextActive: {
        fontWeight: '700',
        color: Colors.light.primary,
    },
});
