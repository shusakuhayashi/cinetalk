import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacySettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchPrivacySettings();
    }, [user]);

    const fetchPrivacySettings = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_private')
                .eq('id', user?.id)
                .single();

            if (data) {
                setIsPrivate(data.is_private);
            }
        } catch (error) {
            console.error('Error fetching privacy settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePrivacy = async (value: boolean) => {
        if (!user) return;
        setIsPrivate(value); // Optimistic update

        const { error } = await supabase
            .from('profiles')
            .update({ is_private: value })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating privacy:', error);
            Alert.alert('エラー', '設定の保存に失敗しました');
            setIsPrivate(!value); // Rollback
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>プライバシー設定</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator color={Colors.light.primary} />
                ) : (
                    <>
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>アカウントを非公開にする</Text>
                                <Text style={styles.settingDescription}>
                                    非公開アカウントにすると、あなたが承認したフォロワーのみが、あなたのレビューやウォッチリストを見ることができます。
                                </Text>
                            </View>
                            <Switch
                                value={isPrivate}
                                onValueChange={handleTogglePrivacy}
                                trackColor={{ false: '#767577', true: Colors.light.primary }}
                                thumbColor={isPrivate ? '#fff' : '#f4f3f4'}
                            />
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    content: {
        padding: 24,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    settingDescription: {
        fontSize: 14,
        color: Colors.light.textMuted,
        lineHeight: 20,
    },
});
