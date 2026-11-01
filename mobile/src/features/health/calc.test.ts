/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageFrom, bmi, bmiCategory, bmr, dailyTargets, type HealthProfile } from './calc.ts';

const today = new Date(2026, 10, 1); // 1 Kasım 2026

test('bmi ve kategori', () => {
  assert.equal(bmi(80, 180), 24.7);
  assert.equal(bmiCategory(24.7), 'normal');
  assert.equal(bmiCategory(18.4), 'underweight');
  assert.equal(bmiCategory(30), 'obese');
});

test('yaş doğum gününe göre hesaplanır', () => {
  assert.equal(ageFrom('2000-11-01', today), 26);
  assert.equal(ageFrom('2000-11-02', today), 25);
});

test('Mifflin-St Jeor BMR', () => {
  // 10*80 + 6.25*180 - 5*25 + 5 = 1805
  assert.equal(bmr({ sex: 'male', weight_kg: 80, height_cm: 180 }, 25), 1805);
  // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
  assert.equal(bmr({ sex: 'female', weight_kg: 60, height_cm: 165 }, 30), 1320);
});

test('hedeflere göre günlük kalori ve makrolar', () => {
  const base: HealthProfile = {
    birth_date: '2001-06-15',
    sex: 'male',
    height_cm: 180,
    weight_kg: 80,
    goal: 'maintain',
    activity_level: 'moderate',
    experience: 'intermediate',
  };
  const maintain = dailyTargets(base, today);
  assert.equal(maintain.tdee, Math.round(maintain.bmr * 1.55));
  assert.equal(maintain.kcal, maintain.tdee);

  const cut = dailyTargets({ ...base, goal: 'lose_fat' }, today);
  assert.ok(cut.kcal < maintain.kcal);
  assert.equal(cut.protein_g, 176);

  // Makroların kalorisi hedefe yakın olmalı (yuvarlama payı)
  const sum = cut.protein_g * 4 + cut.carbs_g * 4 + cut.fat_g * 9;
  assert.ok(Math.abs(sum - cut.kcal) < 10);
});

test('kalori hedefi BMR altına düşmez', () => {
  const t = dailyTargets(
    {
      birth_date: '1990-01-01',
      sex: 'female',
      height_cm: 155,
      weight_kg: 45,
      goal: 'lose_fat',
      activity_level: 'sedentary',
      experience: 'beginner',
    },
    today,
  );
  assert.ok(t.kcal >= t.bmr);
});
