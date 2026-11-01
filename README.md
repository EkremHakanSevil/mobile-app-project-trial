# Arena

Sporcular için hepsi bir arada mobil uygulama: antrenman takibi ve değerlendirme, fotoğraftan kalori/makro,
spor salonu haritası ve indirimli günlük giriş, kulüpler, sosyal akış ve yarışmalar.

## Stack

| Katman | Teknoloji |
|---|---|
| Mobil | Expo SDK 58, React Native, TypeScript, Expo Router |
| Backend | Supabase (Postgres + RLS, Auth, Storage, Edge Functions) |
| AI | Vision LLM (edge function üzerinden; anahtar istemcide tutulmaz) |
| Harita | react-native-maps + Google Places (yalnızca `place_id` saklanır) |
| Ödeme | iyzico (sandbox), QR bilet |

## Yapı

```
mobile/
  src/app/            Ekranlar (Expo Router; her dosya bir route)
    (auth)/           Giriş, kayıt
    (tabs)/           Bugün, Antrenman, Beslenme, Salonlar, Topluluk
    onboarding.tsx    Profil + sağlık bilgileri (KVKK onayı)
    profile.tsx
  src/features/       Modül bazlı mantık (auth, health, ...)
  src/components/     Ortak UI
  src/lib/            Supabase istemcisi, tema
supabase/
  migrations/         Tüm modüllerin şeması + RLS + storage
  seed.sql            Egzersiz kütüphanesi
```

## Kurulum

1. [supabase.com](https://supabase.com)'da proje aç.
2. SQL Editor'de sırayla `supabase/migrations/*.sql` ve `supabase/seed.sql` dosyalarını çalıştır
   (ya da Supabase CLI ile `supabase db push`).
3. `mobile/.env.example` dosyasını `mobile/.env` olarak kopyala, URL ve anon key'i gir.
4. Çalıştır:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
   Telefonda Expo Go ile QR kodu okut.

## Kontroller

```bash
cd mobile
npm run typecheck
npm test
```

## Yol haritası

- [x] 1. Temel: auth, onboarding, sağlık profili, günlük kalori/makro hedefi, sekme iskeleti, tüm şema
- [ ] 2. Antrenman kaydı + AI değerlendirme (hedef, son 7 günlük yük, kas grubu dengesi)
- [ ] 3. Beslenme: fotoğraftan kalori/makro, elle giriş, barkod
- [ ] 4. Salon haritası
- [ ] 5. Günlük giriş ödemesi (iyzico) + QR doğrulama paneli
- [ ] 6. Kulüpler + sosyal akış
- [ ] 7. Yarışmalar + liderlik tablosu + hile bildirimi

## Notlar

- Sağlık verileri (`health_profiles`) KVKK gereği ayrı tabloda ve yalnızca sahibine açık.
- BMI yalnızca bilgi amaçlı gösterilir. Antrenman değerlendirmesi hedef ve antrenman geçmişine dayanır.
- Günlük giriş kayıtları istemciden oluşturulamaz, ödeme onayı edge function üzerinden yapılır.
