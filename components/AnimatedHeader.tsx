import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Animated,
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAuthStore } from '../stores/authStore';

const HEADER_HEIGHT = 50;

// ポップコーンロゴ（画像版）
const PopcornLogo = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginRight: 12 }}>
        <Image
            source={require('../assets/logo-cloud-camera.png')}
            style={{
                width: 28,
                height: 28,
            }}
            resizeMode="contain"
        />
    </View>
);

// ヘッダー左側のロゴ + タイトル
const HeaderLeft = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PopcornLogo />
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

// スクロール方向を追跡するためのコンテキスト
interface HeaderContextType {
    translateY: Animated.Value;
    handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const useAnimatedHeader = () => {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error('useAnimatedHeader must be used within HeaderProvider');
    }
    return context;
};

interface HeaderProviderProps {
    children: React.ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down'>('up');
    const isAnimating = useRef(false);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const insets = { top: 0 }; // Will be handled by component

        // スクロール方向を判定
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';

        // 最上部付近（100px以下）では常にヘッダーを表示
        if (currentScrollY < 100) {
            if (translateY._value !== 0) {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 10,
                }).start();
            }
            lastScrollY.current = currentScrollY;
            return;
        }

        // 方向が変わった時だけアニメーション
        if (direction !== scrollDirection.current && !isAnimating.current) {
            scrollDirection.current = direction;
            isAnimating.current = true;

            const toValue = direction === 'down' ? -(HEADER_HEIGHT + 50) : 0;

            Animated.spring(translateY, {
                toValue,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start(() => {
                isAnimating.current = false;
            });
        }

        lastScrollY.current = currentScrollY;
    }, [translateY]);

    return (
        <HeaderContext.Provider value={{ translateY, handleScroll }}>
            {children}
        </HeaderContext.Provider>
    );
};

interface AnimatedHeaderProps {
    title?: string;
    showBackButton?: boolean;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
    title = 'シネマ管理くん〜 話、聞こか？ 〜',
    showBackButton = false,
}) => {
    const insets = useSafeAreaInsets();
    const { translateY } = useAnimatedHeader();

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    paddingTop: insets.top,
                    height: HEADER_HEIGHT + insets.top,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.headerContent}>
                {showBackButton ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                ) : (
                    <HeaderLeft />
                )}
                <Text style={styles.headerTitle}>{title}</Text>
                <ProfileIcon />
            </View>
        </Animated.View>
    );
};

// 静的ヘッダーコンポーネント（スクロールアニメーションなし）
interface StaticHeaderProps {
    title?: string;
    showBackButton?: boolean;
}

export const StaticHeader: React.FC<StaticHeaderProps> = ({
    title = 'シネマ管理くん〜 話、聞こか？ 〜',
    showBackButton = false,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.header,
                {
                    paddingTop: insets.top,
                    height: HEADER_HEIGHT + insets.top,
                    position: 'relative',
                },
            ]}
        >
            <View style={styles.headerContent}>
                {showBackButton ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                ) : (
                    <HeaderLeft />
                )}
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.headerSpacer} />
                <ProfileIcon />
            </View>
        </View>
    );
};

// スクロールハンドラ付きのコンポーネントを作るためのカスタムフック
export const useScrollHandler = () => {
    const translateY = useRef(new Animated.Value(0)).current;
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down'>('up');
    const isAnimating = useRef(false);
    const insets = useSafeAreaInsets();

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;

        // スクロール方向を判定
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';

        // 最上部付近（100px以下）では常にヘッダーを表示
        if (currentScrollY < 100) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start();
            lastScrollY.current = currentScrollY;
            scrollDirection.current = 'up';
            return;
        }

        // 方向が変わった時だけアニメーション
        if (direction !== scrollDirection.current && !isAnimating.current) {
            scrollDirection.current = direction;
            isAnimating.current = true;

            const toValue = direction === 'down' ? -(HEADER_HEIGHT + insets.top + 10) : 0;

            Animated.spring(translateY, {
                toValue,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start(() => {
                isAnimating.current = false;
            });
        }

        lastScrollY.current = currentScrollY;
    }, [translateY, insets.top]);

    return { translateY, handleScroll };
};

// スクロール対応のフレキシブルヘッダー
interface ScrollAwareHeaderProps {
    title?: string;
    showBackButton?: boolean;
    translateY: Animated.Value;
}

export const ScrollAwareHeader: React.FC<ScrollAwareHeaderProps> = ({
    title = 'シネマ管理くん〜 話、聞こか？ 〜',
    showBackButton = false,
    translateY,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    paddingTop: insets.top,
                    height: HEADER_HEIGHT + insets.top,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.headerContent}>
                {showBackButton ? (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>
                ) : (
                    <HeaderLeft />
                )}
                <Text style={styles.headerTitle}>{title}</Text>
                <ProfileIcon />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.light.headerBg,
        zIndex: 1000,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontWeight: '600',
        fontSize: 14,
        letterSpacing: 2,
        color: Colors.light.headerText,
    },
    headerSpacer: {
        flex: 1,
    },
    backButton: {
        marginLeft: 8,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 32,
        color: Colors.light.headerText,
        fontWeight: '300',
    },
});

export { HEADER_HEIGHT };
