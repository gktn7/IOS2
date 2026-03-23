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

export default function RegisterScreen() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);
        try {
            await register({ name: name.trim(), email: email.trim().toLowerCase(), password });
        } catch (error: any) {
            const msg = error?.response?.data?.detail || 'Kayıt oluşturulamadı. Tekrar deneyin.';
            Alert.alert('Kayıt Hatası', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoIcon}>📰</Text>
                        </View>
                        <Text style={styles.appName}>HaberAkışı</Text>
                        <Text style={styles.tagline}>Hesabını oluştur, haberlere başla</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>Birkaç saniyede ücretsiz üye ol</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Ad Soyad</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Adınız Soyadınız"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="words"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

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
                                placeholder="En az 6 karakter"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.registerBtn, loading && styles.btnDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerBtnText}>Kayıt Ol</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginLink}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.loginLinkText}>
                                Zaten hesabın var mı?{' '}
                                <Text style={styles.loginLinkBold}>Giriş Yap</Text>
                            </Text>
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
        backgroundColor: '#8B5CF6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#8B5CF6',
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
    registerBtn: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    btnDisabled: { opacity: 0.7 },
    registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    loginLink: { alignItems: 'center', marginTop: 20 },
    loginLinkText: { color: '#64748B', fontSize: 14 },
    loginLinkBold: { color: '#8B5CF6', fontWeight: '700' },
});
