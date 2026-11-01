import { useState } from 'react';
import { ErrorText, Field, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { HealthForm } from '@/features/health/HealthForm';
import { saveHealth } from '@/features/health/saveHealth';
import { supabase } from '@/lib/supabase';

export default function Onboarding() {
  const { session, refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(h: Parameters<typeof saveHealth>[1]): Promise<string | null> {
    const userId = session?.user.id;
    if (!userId) return 'Oturum bulunamadı.';
    const uname = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(uname)) {
      setError('Kullanıcı adı 3-24 karakter; küçük harf, rakam ve _ içerebilir.');
      return 'Kullanıcı adını düzelt.';
    }
    setError(null);

    const healthErr = await saveHealth(userId, h);
    if (healthErr) return healthErr;

    const { error: err } = await supabase.from('profiles').update({ username: uname, onboarded: true }).eq('id', userId);
    if (err) return err.code === '23505' ? 'Bu kullanıcı adı alınmış.' : err.message;

    await refresh(); // onboarded=true olunca router sekmelere geçer
    return null;
  }

  return (
    <Screen>
      <Title>Seni tanıyalım</Title>
      <Subtitle>Günlük kalori, makro hedefin ve antrenman önerileri bu bilgilere göre hesaplanır.</Subtitle>
      <Field label="Kullanıcı adı" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} />
      <ErrorText>{error}</ErrorText>
      <HealthForm submitLabel="Başla" requireConsent onSubmit={submit} />
    </Screen>
  );
}
