import { ComingSoon } from '@/components/ComingSoon';

export default function Workout() {
  return (
    <ComingSoon
      title="Antrenman"
      intro="Sıradaki modül. Günlük antrenmanını kaydet, AI hedefine göre değerlendirsin."
      items={[
        'Egzersiz kütüphanesi (kuvvet, calisthenics, kardiyo)',
        'Set / tekrar / ağırlık / süre kaydı',
        'Değerlendirme: az, yeterli ya da fazla',
        'Eksik kas grupları ve gereksiz tekrarlar',
        'Son 7 günlük yük ve toparlanma takibi',
      ]}
    />
  );
}
