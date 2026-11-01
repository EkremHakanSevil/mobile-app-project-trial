import { router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Screen, Subtitle } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { HealthForm } from '@/features/health/HealthForm';
import { saveHealth } from '@/features/health/saveHealth';
import { colors } from '@/lib/theme';

export default function ProfileScreen() {
  const { session, profile, health, refresh, signOut } = useAuth();

  return (
    <Screen>
      <Card>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{profile?.full_name}</Text>
        <Text style={{ color: colors.textMuted }}>@{profile?.username}</Text>
      </Card>
      <Subtitle>Bilgilerini güncellediğinde günlük hedeflerin yeniden hesaplanır.</Subtitle>
      <HealthForm
        initial={health}
        submitLabel="Kaydet"
        onSubmit={async (h) => {
          if (!session) return 'Oturum bulunamadı.';
          const err = await saveHealth(session.user.id, h);
          if (!err) {
            await refresh();
            router.back();
          }
          return err;
        }}
      />
      <Button title="Çıkış yap" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
