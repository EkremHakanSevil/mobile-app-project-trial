import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, ErrorText, Field, Screen, Subtitle, Title } from '@/components/ui';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'E-posta ya da şifre hatalı.' : err.message);
  }

  return (
    <Screen>
      <Title>Arena</Title>
      <Subtitle>Antrenman, beslenme, salonlar ve kulüpler tek yerde.</Subtitle>
      {!isSupabaseConfigured && (
        <Card>
          <Text style={{ color: colors.warning }}>
            Supabase yapılandırılmamış. mobile/.env dosyasına EXPO_PUBLIC_SUPABASE_URL ve
            EXPO_PUBLIC_SUPABASE_ANON_KEY ekle.
          </Text>
        </Card>
      )}
      <Field
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <ErrorText>{error}</ErrorText>
      <Button title="Giriş yap" onPress={signIn} loading={loading} disabled={!email || !password} />
      <Link href="/sign-up" style={{ color: colors.primary, textAlign: 'center', padding: 8 }}>
        Hesabın yok mu? Kayıt ol
      </Link>
    </Screen>
  );
}
