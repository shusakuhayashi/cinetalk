import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../stores/authStore';
import { StaticHeader, HEADER_HEIGHT } from '../../components/AnimatedHeader';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const { user, isAuthenticated, isLoading, signIn, signUp, signOut, checkSession } =
        useAuthStore();

    useEffect(() => {
        checkSession();
    }, []);

    const handleAuth = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
            return;
        }

        setLocalLoading(true);
        const result = isLogin
            ? await signIn(email, password)
            : await signUp(email, password);
        setLocalLoading(false);

        if (result.error) {
            Alert.alert('エラー', result.error);
        } else if (!isLogin) {
            Alert.alert('成功', '確認メールを送信しました。メールを確認してください。');
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setEmail('');
        setPassword('');
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.accent} />
            </View>
        );
    }

    // ログイン済み状態
    if (isAuthenticated && user) {
        return (
            <View style={styles.container}>
                {/* 固定ヘッダー */}
                <StaticHeader title="PROFILE" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top }}
                >
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>USER</Text>
                        </View>
                        <Text style={styles.userName}>{user.display_name || 'ユーザー'}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>

                    {/* 統計 */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>鑑賞数</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>レビュー</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>お気に入り</Text>
                        </View>
                    </View>

                    {/* メニュー */}
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>EDIT PROFILE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>FAVORITES</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>WATCHLIST</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem}>
                            <Text style={styles.menuText}>SETTINGS</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                        <Text style={styles.logoutButtonText}>ログアウト</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // 未ログイン状態（ログイン/新規登録フォーム）
    return (
        <View style={styles.container}>
            {/* 固定ヘッダー */}
            <StaticHeader title="PROFILE" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{ paddingTop: HEADER_HEIGHT + insets.top, flex: 1 }}
            >
                <View style={styles.authContainer}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>APP</Text>
                    </View>
                    <Text style={styles.authTitle}>
                        {isLogin ? 'ログイン' : '新規登録'}
                    </Text>
                    <Text style={styles.authDescription}>
                        シネマ管理くんで映画の感想を共有しよう
                    </Text>

                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="メールアドレス"
                            placeholderTextColor={Colors.light.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="パスワード"
                            placeholderTextColor={Colors.light.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.authButton, localLoading && styles.authButtonDisabled]}
                            onPress={handleAuth}
                            disabled={localLoading}
                        >
                            {localLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.authButtonText}>
                                    {isLogin ? 'ログイン' : '新規登録'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            <Text style={styles.switchButtonText}>
                                {isLogin
                                    ? 'アカウントをお持ちでないですか？ 新規登録'
                                    : 'すでにアカウントをお持ちですか？ ログイン'}
                            </Text>
                        </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    header: {
        backgroundColor: Colors.light.surface,
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.light.border,
    },
    avatarText: {
        fontSize: 48,
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.light.surface,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.light.border,
    },
    menuContainer: {
        marginTop: 20,
        marginHorizontal: 20,
        backgroundColor: Colors.light.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    menuText: {
        fontSize: 16,
        color: Colors.light.primary,
    },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: Colors.light.surface,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFCCCC',
    },
    logoutButtonText: {
        color: '#CC0000',
        fontSize: 16,
        fontWeight: '600',
    },
    // 認証フォーム
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.primary,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 8,
    },
    authDescription: {
        fontSize: 14,
        color: Colors.light.textMuted,
        textAlign: 'center',
        marginBottom: 30,
    },
    formContainer: {
        gap: 16,
    },
    input: {
        backgroundColor: Colors.light.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    authButton: {
        backgroundColor: Colors.light.accent,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    authButtonDisabled: {
        opacity: 0.7,
    },
    authButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchButtonText: {
        color: Colors.light.accent,
        fontSize: 14,
    },
});
