# SmartPOS - Do'kon boshqaruv tizimi

To'liq ishlaydigan, demo-ma'lumotlar bilan boyitilgan POS (savdo nuqtasi) boshqaruv tizimi. React + TypeScript + Zustand asosida qurilgan, barcha ma'lumotlar brauzer xotirasida (localStorage) saqlanadi.

## Ishga tushirish

```bash
npm install
npm start
```

Brauzerda `http://localhost:3000` ochiladi.

## Demo hisoblar

| Login      | Parol      | Lavozim          |
|------------|------------|------------------|
| admin      | admin123   | Administrator    |
| kassir1    | kassir123  | Kassir           |
| ombor      | ombor123   | Omborchi         |
| buxgalter  | buh123     | Buxgalter        |

## Imkoniyatlar

- **Kassa (POS)** — barcode skanerlash, savatcha, chegirma/kupon (SALE10, SALE20, VIP15), naqd/karta/onlayn/aralash to'lov, chek chop etish
- **Mahsulotlar** — to'liq CRUD, barcode, kategoriya, ta'minotchi, narx, soliq
- **Kategoriyalar** — qo'shish/o'chirish, mahsulot soni
- **Ombor** — kirim/chiqim/tuzatish, kam qolgan va tugagan mahsulotlar
- **Sotuvlar tarixi** — sana bo'yicha filtr, CSV eksport, chek tafsilotlari
- **Xaridlar** — ta'minotchidan kirim, qarz hisobi
- **Mijozlar** — CRM, xarid tarixi, qarz to'lash, sodiqlik ballari
- **Ta'minotchilar** — CRUD, qarz nazorati
- **Xodimlar** — foydalanuvchi boshqaruvi, rol asosida ruxsatlar
- **Moliya** — daromad/xarajat/foyda tahlili, xarajat qo'shish
- **Hisobotlar** — sotuv, mahsulot, ombor, xodim, moliyaviy hisobotlar (CSV eksport)
- **Faollik jurnali** — barcha amallar tarixi
- **Sozlamalar** — do'kon ma'lumotlari, chek matni, valyuta
- **Tungi/kunduzgi mavzu** (dark/light theme)

## Texnologiyalar

- React 18 + TypeScript
- React Router (HashRouter)
- Zustand (persist middleware — localStorage)
- Recharts (grafiklar)

## Supabase'ga ulash

Hozircha barcha ma'lumotlar `src/data/seedData.ts` da mock data sifatida va `src/store/useAppStore.ts` orqali localStorage'da saqlanadi. Supabase'ga ulash uchun `useAppStore.ts` dagi har bir mutatsiya funksiyasini (`addProduct`, `completeSale`, va h.k.) mos Supabase so'rovlariga almashtiring.

## Windows .exe sifatida paketlash

Electron + electron-builder yordamida:
1. `electron.js` faylini `public/` papkasiga joylashtiring (build vaqtida `build/` ga ko'chiriladi)
2. `npm run build` orqali production build yarating
3. `electron-builder` bilan `.exe` ga o'rang
