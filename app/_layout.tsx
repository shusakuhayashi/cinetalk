import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: Colors.light.background },
                    }}
                >
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen
                        name="profile"
                        options={{
                            headerShown: false,
                            presentation: 'modal',
                        }}
                    />
                    <Stack.Screen
                        name="search/users"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="settings/privacy"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="movie/[id]"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="person/[id]"
                        options={{
                            headerShown: false,
                        }}
                    />
                </Stack>
            </SafeAreaProvider>
        </AuthProvider>
    );
}
