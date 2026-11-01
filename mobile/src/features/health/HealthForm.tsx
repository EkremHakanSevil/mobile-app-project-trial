import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Choice, ErrorText, Field } from '@/components/ui';
import { colors, spacing } from '@/lib/theme';
import type { ActivityLevel, ExperienceLevel, FitnessGoal, HealthProfile, Sex } from './calc';
import { ACTIVITY_OPTIONS, EXPERIENCE_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS } from './labels';

// Onboarding ve profil düzenlemede ortak kullanılan sağlık formu
export function HealthForm({
  initial,
  submitLabel,
  requireConsent,
  onSubmit,
}: {
  initial?: HealthProfile | null;
  submitLabel: string;
  requireConsent?: boolean;
  onSubmit: (h: HealthProfile) => Promise<string | null>; // hata mesajı ya da null
}) {
  const [birth, setBirth] = useState(initial?.birth_date ?? '');
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [height, setHeight] = useState(initial ? String(initial.height_cm) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weight_kg) : '');
  const [goal, setGoal] = useState<FitnessGoal | null>(initial?.goal ?? null);
  const [activity, setActivity] = useState<ActivityLevel | null>(initial?.activity_level ?? null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(initial?.experience ?? null);
  const [consent, setConsent] = useState(!requireConsent);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    const h = Number(height.replace(',', '.'));
    const w = Number(weight.replace(',', '.'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth) || Number.isNaN(Date.parse(birth))) {
      return setError('Doğum tarihini YYYY-AA-GG biçiminde gir (ör. 2000-05-14).');
    }
    if (!(h >= 100 && h <= 250)) return setError('Boy 100-250 cm arasında olmalı.');
    if (!(w >= 30 && w <= 300)) return setError('Kilo 30-300 kg arasında olmalı.');
    if (!sex || !goal || !activity || !experience) return setError('Tüm seçimleri yap.');
    if (!consent) return setError('Devam etmek için sağlık verisi onayını vermelisin.');

    setSaving(true);
    const err = await onSubmit({
      birth_date: birth,
      sex,
      height_cm: h,
      weight_kg: w,
      goal,
      activity_level: activity,
      experience,
    });
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Field
        label="Doğum tarihi"
        placeholder="2000-05-14"
        value={birth}
        onChangeText={setBirth}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <Choice label="Cinsiyet" options={SEX_OPTIONS} value={sex} onChange={setSex} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Field label="Boy (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
        </View>
      </View>
      <Choice label="Hedefin" options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
      <Choice label="Aktivite seviyen" options={ACTIVITY_OPTIONS} value={activity} onChange={setActivity} />
      <Choice label="Antrenman deneyimin" options={EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} />

      {requireConsent && (
        <Choice
          label="KVKK açık rıza"
          options={[{ value: 'yes', label: 'Sağlık verilerimin işlenmesine onay veriyorum' }]}
          value={consent ? 'yes' : null}
          onChange={() => setConsent((c) => !c)}
        />
      )}
      {requireConsent && (
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Boy, kilo ve hedef bilgilerin yalnızca sana özel hesaplamalar için kullanılır ve başka kullanıcılara
          gösterilmez.
        </Text>
      )}

      <ErrorText>{error}</ErrorText>
      <Button title={submitLabel} onPress={submit} loading={saving} />
    </View>
  );
}
