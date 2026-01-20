import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';

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

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,

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
                    tabBarIcon: ({ focused }) => <TabIcon label="HOME" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="timeline"
                options={{
                    title: 'TIMELINE',
                    tabBarIcon: ({ focused }) => <TabIcon label="TIMELINE" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: 'LOG',
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
                }}
            />
        </Tabs>
    );
}
