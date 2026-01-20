import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const redirectUrl = Linking.createURL('/'); // ディープリンク用URL
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });

            if (error) throw error;

            // Webの場合、supabase-jsが自動的にリダイレクトを処理する場合があるが、
            // Nativeの場合はブラウザが開く。
            // 成功すればAuthContextが検知して状態更新されるはず。
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.replace('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                Alert.alert('確認メールを送信しました', 'メールを確認して登録を完了してください');
                setMode('signin');
            }
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>CINEMA TALK</Text>
                    <Text style={styles.subtitle}>
                        映画の記録と会話を{'\n'}クラウドに保存しよう
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Google Login Button */}
                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image
                                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/240px-Google_%22G%22_logo.svg.png' }}
                                style={{ width: 24, height: 24, marginRight: 12 }}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleButtonText}>Googleで続ける</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>または</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Email Form */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>メールアドレス</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="example@email.com"
                            placeholderTextColor={Colors.light.textMuted}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>パスワード</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="6文字以上"
                            placeholderTextColor={Colors.light.textMuted}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.authButton}
                        onPress={handleEmailAuth}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.authButtonText}>
                                {mode === 'signin' ? 'ログイン' : '新規登録'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.switchModeButton}
                        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    >
                        <Text style={styles.switchModeText}>
                            {mode === 'signin'
                                ? 'アカウントをお持ちでない方はこちら'
                                : 'すでにアカウントをお持ちの方はこちら'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => router.replace('/')}
                >
                    <Text style={styles.skipButtonText}>ログインせずに利用する</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.light.primary,
        marginBottom: 12,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.text,
        textAlign: 'center',
        lineHeight: 24,
    },
    formContainer: {
        width: '100%',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.light.border,
    },
    dividerText: {
        marginHorizontal: 16,
        color: Colors.light.textMuted,
        fontSize: 14,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.light.text,
    },
    authButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    authButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    switchModeButton: {
        alignItems: 'center',
        padding: 8,
    },
    switchModeText: {
        color: Colors.light.primary,
        fontSize: 14,
    },
    skipButton: {
        marginTop: 32,
        alignItems: 'center',
    },
    skipButtonText: {
        color: Colors.light.textMuted,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
