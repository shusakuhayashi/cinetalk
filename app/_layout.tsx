import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
    return (
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
                    name="movie/[id]"
                    options={{
                        headerShown: true,
                        headerTitle: '',
                        headerTransparent: true,
                        headerTintColor: '#FFFFFF',
                        headerStyle: {
                            backgroundColor: 'transparent',
                        },
                    }}
                />
                <Stack.Screen
                    name="person/[id]"
                    options={{
                        headerShown: true,
                        headerTitle: '',
                        headerStyle: {
                            backgroundColor: Colors.light.headerBg,
                        },
                        headerTintColor: Colors.light.headerText,
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    );
}
