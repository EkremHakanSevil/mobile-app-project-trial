import { ComingSoon } from '@/components/ComingSoon';

export default function Nutrition() {
  return (
    <ComingSoon
      title="Beslenme"
      intro="Yemeğinin fotoğrafını çek, kalori ve makrolar tahmin edilsin."
      items={[
        'Fotoğraftan AI ile kalori/makro tahmini',
        'Tahmini düzeltme ve porsiyon ayarı',
        'Elle arama ve barkod okuma',
        'Günlük hedefe göre kalan kalori/makro',
      ]}
    />
  );
}
