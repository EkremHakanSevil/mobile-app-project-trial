import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Label, Screen, Subtitle, Title } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { dailyTargets } from '@/features/health/calc';
import { BMI_LABEL, GOAL_OPTIONS, labelOf } from '@/features/health/labels';
import { colors, spacing } from '@/lib/theme';

export default function Today() {
  const { profile, health } = useAuth();
  const targets = useMemo(() => (health ? dailyTargets(health) : null), [health]);
  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? '';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Title>Merhaba {firstName}</Title>
          {health && <Subtitle>Hedef: {labelOf(GOAL_OPTIONS, health.goal)}</Subtitle>}
        </View>
        <Link href="/profile" asChild>
          <Pressable accessibilityLabel="Profil" hitSlop={12}>
            <Ionicons name="person-circle" size={36} color={colors.textMuted} />
          </Pressable>
        </Link>
      </View>

      {targets && (
        <>
          <Card>
            <Label>Günlük kalori hedefi</Label>
            <Text style={styles.big}>
              {targets.kcal} <Text style={styles.unit}>kcal</Text>
            </Text>
            <Text style={styles.muted}>
              Bazal metabolizma {targets.bmr} kcal · Günlük harcama {targets.tdee} kcal
            </Text>
          </Card>

          <Card>
            <Label>Makro hedefleri</Label>
            <View style={styles.macroRow}>
              <Macro label="Protein" grams={targets.protein_g} color={colors.protein} />
              <Macro label="Karbonhidrat" grams={targets.carbs_g} color={colors.carbs} />
              <Macro label="Yağ" grams={targets.fat_g} color={colors.fat} />
            </View>
          </Card>

          <Card>
            <Label>Vücut kitle indeksi</Label>
            <Text style={styles.mid}>
              {targets.bmi} · {BMI_LABEL[targets.bmiCategory]}
            </Text>
            <Text style={styles.muted}>
              BMI kas ile yağı ayırmaz. Antrenman değerlendirmelerin BMI'ya değil, hedefine ve antrenman geçmişine
              göre yapılır.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Macro({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.xs }}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.mid}>{grams} g</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  big: { color: colors.text, fontSize: 40, fontWeight: '800' },
  mid: { color: colors.text, fontSize: 20, fontWeight: '700' },
  unit: { fontSize: 18, color: colors.textMuted, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
