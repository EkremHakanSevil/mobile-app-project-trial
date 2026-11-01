import type { ActivityLevel, BmiCategory, ExperienceLevel, FitnessGoal, Sex } from './calc';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
];

export const GOAL_OPTIONS: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_fat', label: 'Yağ yakmak' },
  { value: 'build_muscle', label: 'Kas kazanmak' },
  { value: 'strength', label: 'Güçlenmek' },
  { value: 'endurance', label: 'Dayanıklılık' },
  { value: 'maintain', label: 'Formu korumak' },
];

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Hareketsiz' },
  { value: 'light', label: 'Haftada 1-2 gün' },
  { value: 'moderate', label: 'Haftada 3-4 gün' },
  { value: 'active', label: 'Haftada 5-6 gün' },
  { value: 'very_active', label: 'Her gün / ağır iş' },
];

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Yeni başlayan' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
];

export const BMI_LABEL: Record<BmiCategory, string> = {
  underweight: 'Zayıf',
  normal: 'Normal',
  overweight: 'Fazla kilolu',
  obese: 'Obez',
};

export function labelOf<T extends string>(options: { value: T; label: string }[], v: T): string {
  return options.find((o) => o.value === v)?.label ?? v;
}
