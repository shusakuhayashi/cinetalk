import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../stores/authStore';

// ミニマルなアイコンコンポーネント
const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{
            fontSize: 9,
            fontWeight: focused ? '700' : '500',
            letterSpacing: 1,
            color: focused ? Colors.light.primary : Colors.light.textMuted,
        }}>
            {label}
        </Text>
    </View>
);

// ヘッダー右側のプロフィールアイコン
const ProfileIcon = () => {
    const { user, isAuthenticated } = useAuthStore();

    return (
        <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={{
                marginRight: 16,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isAuthenticated ? Colors.light.headerText : 'transparent',
                borderWidth: isAuthenticated ? 0 : 1.5,
                borderColor: Colors.light.headerText,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {isAuthenticated && user?.avatar_url ? (
                <Image
                    source={{ uri: user.avatar_url }}
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                />
            ) : isAuthenticated && user?.name ? (
                <Text style={{
                    fontSize: 12,
                    color: Colors.light.headerBg,
                    fontWeight: '600',
                }}>
                    {user.name.charAt(0).toUpperCase()}
                </Text>
            ) : (
                // 未ログイン: 人マーク
                <View style={{ alignItems: 'center' }}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: Colors.light.headerText,
                        marginBottom: 2,
                    }} />
                    <View style={{
                        width: 14,
                        height: 6,
                        borderTopLeftRadius: 7,
                        borderTopRightRadius: 7,
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderBottomWidth: 0,
                        borderColor: Colors.light.headerText,
                    }} />
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.light.headerBg,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: Colors.light.headerText,
                headerTitleStyle: {
                    fontWeight: '600',
                    fontSize: 14,
                    letterSpacing: 2,
                },
                headerRight: () => <ProfileIcon />,

                tabBarStyle: {
                    backgroundColor: Colors.light.tabBg,
                    borderTopWidth: 1,
                    borderTopColor: Colors.light.border,
                    height: 64 + insets.bottom,
                    paddingBottom: insets.bottom + 8,
                    paddingTop: 10,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'HOME',
                    headerTitle: 'CINETALK',
                    tabBarIcon: ({ focused }) => <TabIcon label="HOME" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'LOG',
                    headerTitle: 'WATCH LOG',
                    tabBarIcon: ({ focused }) => <TabIcon label="LOG" focused={focused} />,
                }}
            />
            {/* 隠し画面（タブバーに表示しない） */}
            <Tabs.Screen
                name="search"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    href: null,
                    headerTitle: 'REVIEW',
                }}
            />
        </Tabs>
    );
}
