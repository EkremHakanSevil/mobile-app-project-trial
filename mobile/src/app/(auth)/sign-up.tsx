import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Card, ErrorText, Field, Screen, Subtitle, Title } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { Text } from 'react-native';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setError(null);
    if (password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (err) return setError(err.message);
    // E-posta doğrulaması açıksa oturum gelmez
    if (!data.session) setInfo('Doğrulama bağlantısı e-postana gönderildi. Onayladıktan sonra giriş yap.');
  }

  return (
    <Screen>
      <Title>Kayıt ol</Title>
      <Subtitle>Hesabını oluştur, sonra seni tanıyalım.</Subtitle>
      <Field label="Ad soyad" value={name} onChangeText={setName} autoComplete="name" />
      <Field
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <ErrorText>{error}</ErrorText>
      {info && (
        <Card>
          <Text style={{ color: colors.text }}>{info}</Text>
        </Card>
      )}
      <Button title="Kayıt ol" onPress={signUp} loading={loading} disabled={!name || !email || !password} />
      <Link href="/sign-in" style={{ color: colors.primary, textAlign: 'center', padding: 8 }}>
        Zaten hesabın var mı? Giriş yap
      </Link>
    </Screen>
  );
}
