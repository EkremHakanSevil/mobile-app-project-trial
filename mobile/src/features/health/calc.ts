// Saf hesaplama fonksiyonları: BMI, BMR, TDEE, kalori ve makro hedefleri.
// Bağımlılıksız tutuldu ki node:test ile doğrudan test edilebilsin.

export type Sex = 'male' | 'female';
export type FitnessGoal = 'lose_fat' | 'build_muscle' | 'strength' | 'endurance' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface HealthProfile {
  birth_date: string; // YYYY-MM-DD
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  goal: FitnessGoal;
  activity_level: ActivityLevel;
  experience: ExperienceLevel;
}

export interface DailyTargets {
  bmi: number;
  bmiCategory: BmiCategory;
  bmr: number;
  tdee: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Hedefe göre TDEE üzerine kalori düzeltmesi
const GOAL_KCAL_ADJUST: Record<FitnessGoal, number> = {
  lose_fat: -0.2,
  build_muscle: 0.1,
  strength: 0.05,
  endurance: 0.05,
  maintain: 0,
};

// Vücut ağırlığı başına protein (g/kg)
const GOAL_PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_fat: 2.2,
  build_muscle: 2.0,
  strength: 2.0,
  endurance: 1.6,
  maintain: 1.8,
};

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(weightKg / (m * m));
}

// Not: BMI kas/yağ ayrımı yapmaz. Yalnızca bilgi amaçlı gösterilir,
// antrenman değerlendirmesinde kullanılmaz.
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'underweight';
  if (value < 25) return 'normal';
  if (value < 30) return 'overweight';
  return 'obese';
}

export function ageFrom(birthDate: string, today: Date = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age--;
  return age;
}

// Mifflin-St Jeor
export function bmr(p: Pick<HealthProfile, 'sex' | 'weight_kg' | 'height_cm'>, age: number): number {
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * age;
  return Math.round(p.sex === 'male' ? base + 5 : base - 161);
}

export function dailyTargets(p: HealthProfile, today: Date = new Date()): DailyTargets {
  const b = bmi(p.weight_kg, p.height_cm);
  const basal = bmr(p, ageFrom(p.birth_date, today));
  const tdee = Math.round(basal * ACTIVITY_FACTOR[p.activity_level]);
  // Güvenlik tabanı: BMR'nin altına inme
  const kcal = Math.max(basal, Math.round(tdee * (1 + GOAL_KCAL_ADJUST[p.goal])));

  const protein_g = Math.round(p.weight_kg * GOAL_PROTEIN_PER_KG[p.goal]);
  const fat_g = Math.round(Math.max((kcal * 0.25) / 9, p.weight_kg * 0.6));
  const carbs_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));

  return { bmi: b, bmiCategory: bmiCategory(b), bmr: basal, tdee, kcal, protein_g, fat_g, carbs_g };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
