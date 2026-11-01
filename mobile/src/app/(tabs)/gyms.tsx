import { ComingSoon } from '@/components/ComingSoon';

export default function Gyms() {
  return (
    <ComingSoon
      title="Salonlar"
      intro="Yakınındaki salonları haritada gör, anlaşmalı salonlara indirimli günlük giriş al."
      items={[
        'Google Maps üzerinde yakındaki salonlar',
        'Anlaşmalı salonlar ve indirimli fiyatlar',
        'Uygulama içinden günlük giriş ödemesi',
        'Girişte okutulan QR bilet',
      ]}
    />
  );
}
