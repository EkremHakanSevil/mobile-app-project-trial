import { supabase } from '@/lib/supabase';
import type { HealthProfile } from './calc';

// Sağlık profilini kaydeder, kilo geçmişine de bugünün ölçümünü yazar.
export async function saveHealth(userId: string, h: HealthProfile): Promise<string | null> {
  const { error } = await supabase.from('health_profiles').upsert({ user_id: userId, ...h });
  if (error) return error.message;

  const today = new Date().toISOString().slice(0, 10);
  const m = await supabase
    .from('body_measurements')
    .upsert({ user_id: userId, measured_on: today, weight_kg: h.weight_kg }, { onConflict: 'user_id,measured_on' });
  return m.error?.message ?? null;
}
