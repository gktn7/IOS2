import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        setLoading(true);
        try {
            await login({ email: email.trim().toLowerCase(), password });
            // AuthContext başarılı girişte _layout.tsx redirect'i tetikler
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
            Alert.alert('Giriş Hatası', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {/* Gradient benzeri arka plan */}
            <View style={styles.bg} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Logo & Başlık */}
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoIcon}>📰</Text>
                        </View>
                        <Text style={styles.appName}>HaberAkışı</Text>
                        <Text style={styles.tagline}>Güncel haberlerde öne geç</Text>
                    </View>

                    {/* Kart */}
                    <View style={styles.card}>
                        <Text style={styles.title}>Giriş Yap</Text>
                        <Text style={styles.subtitle}>Hesabına hoş geldin</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-posta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@mail.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Şifreniz"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginBtnText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.registerBtn}
                            onPress={() => router.push('/register')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.registerBtnText}>Hesap Oluştur</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    container: { flex: 1, backgroundColor: '#0F172A' },
    bg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0F172A',
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: { alignItems: 'center', marginBottom: 32 },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#3B82F6',
        shadowOpacity: 0.6,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    logoIcon: { fontSize: 38 },
    appName: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', letterSpacing: 0.5 },
    tagline: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
    card: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    title: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: '#CBD5E1', marginBottom: 8 },
    input: {
        backgroundColor: '#0F172A',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#334155',
    },
    loginBtn: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#3B82F6',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
    dividerText: { color: '#64748B', marginHorizontal: 12, fontSize: 13 },
    registerBtn: {
        borderWidth: 1.5,
        borderColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    registerBtnText: { color: '#3B82F6', fontSize: 15, fontWeight: '700' },
});
