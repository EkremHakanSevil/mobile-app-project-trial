import { ComingSoon } from '@/components/ComingSoon';

export default function Community() {
  return (
    <ComingSoon
      title="Topluluk"
      intro="Kulüp kur ya da katıl, paylaşım yap, yarışmalara gir."
      items={[
        'Kulüpler: koşu, ağırlık, calisthenics, crossfit, bisiklet',
        'Akış: gönderi, yorum, beğeni, antrenman paylaşımı',
        'Yarışmalar: video / GPS kanıtlı sonuç',
        'Liderlik tablosu ve hile bildirimi',
        'Sponsorlu yarışmalar ve ödüller',
      ]}
    />
  );
}
