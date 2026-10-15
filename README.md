# ApartmanYönet

AKKENT SİTESİ için geliştirilmiş, apartman/site yöneticilerinin aidat
takibini, kasayı, gelir-gider işlemlerini, karar defterini ve
toplantıları tek bir panelden yönetmesini sağlayan web uygulaması.

- **Canlı uygulama:** https://apartman-yonetim-e3ur.onrender.com
- **Backend API:** https://apartman-yonetim-backend.onrender.com

## Özellikler

- **Aidatlar / Tahsilatlar** — dairelere aylık aidat oluşturma, ödeme
  kaydetme, 12 aylık ödeme çizelgesi (yazdırılabilir rapor dahil)
- **Devreden Borç** — önceki dönemlerden kalan borçların ayrı takibi
  ve tahsilat kaydı
- **Kasa / Gelir-Gider / İşletme Defteri** — apartmanın tüm gelir ve
  giderlerinin kaydı, otomatik işletme defteri oluşturma
- **Karar Defteri** — yönetim kurulu kararlarının dijital kaydı
- **Toplantılar** — toplantı planlama ve takibi
- **Daireler / Kişiler** — daire, malik ve kiracı bilgilerinin yönetimi
- **Kimlik doğrulama** — e-posta/şifre ile veya Google ile giriş,
  e-posta doğrulama, şifre sıfırlama

## Teknolojiler

**Backend:** Flask 3, SQLAlchemy, Flask-Migrate (Alembic),
Flask-JWT-Extended, Flask-CORS, Gunicorn, PostgreSQL (prod) / SQLite
(yerel geliştirme), Resend (e-posta gönderimi)

**Frontend:** React 19, Vite, React Router

**Dağıtım:** Render (frontend statik site, backend web servisi,
ücretsiz Postgres veritabanı)

## Proje yapısı

```
backend/
  app.py            # Flask uygulaması ve route kayıtları
  config.py         # Ortam değişkenlerinden okunan ayarlar
  models/           # SQLAlchemy modelleri
  routes/           # API endpoint'leri (blueprint başına bir dosya)
  migrations/        # Alembic veritabanı göçleri

frontend/
  src/
    pages/          # Sayfa bileşenleri (Dashboard, Aidatlar, ...)
    components/     # Paylaşılan bileşenler (Sidebar, vb.)
    services/       # Backend API çağrıları
```

## Yerel geliştirme

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

`backend/.env` dosyası oluşturun (hiçbiri zorunlu değildir; eksik
olanlar için makul varsayılanlar kullanılır):

```
DATABASE_URL=sqlite:///apartman.db
JWT_SECRET_KEY=degistirin-bu-anahtari
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev
GOOGLE_CLIENT_ID=
```

Veritabanını oluşturup sunucuyu başlatın:

```bash
flask db upgrade
python app.py
```

Backend varsayılan olarak `http://127.0.0.1:5000` adresinde çalışır.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend adresi farklıysa `frontend/.env` içine
`VITE_API_URL=http://127.0.0.1:5000/api` ekleyin.

## Dağıtım

Uygulama Render üzerinde iki ayrı serviste çalışır:

- **Frontend** — statik site olarak `npm run build` çıktısı (`dist/`)
- **Backend** — `gunicorn app:app` ile çalışan web servisi, ücretsiz
  Postgres veritabanına bağlı

Değişiklikler, `main` dalına push edildiğinde Render üzerinde otomatik
olarak yeniden dağıtılır.
