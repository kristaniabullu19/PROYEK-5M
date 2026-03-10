-- ============================================================
-- KLIK-SDM SUPABASE BACKEND
-- File: 01_schema.sql
-- Deskripsi: Membuat semua tabel yang dibutuhkan aplikasi
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. TABEL: settings (scrolling text & konfigurasi)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          SERIAL PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default scrolling text
INSERT INTO settings (key, value) VALUES
  ('scrolling_text', 'Selamat Datang di KLIK-SDM — Kemudahan Layanan Informasi Kepegawaian BPS Provinsi Sulawesi Utara')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. TABEL: users (admin login)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,   -- disimpan sebagai plain (atau hash di produksi)
  role        TEXT NOT NULL CHECK (role IN ('admin_pengelola', 'admin_kepegawaian')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default admin accounts (ganti password sebelum deploy produksi!)
INSERT INTO users (username, password, role) VALUES
  ('admin', 'Admin@2024', 'admin_pengelola'),
  ('kepegawaian', 'Kepeg@2024', 'admin_kepegawaian')
ON CONFLICT (username) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. TABEL: pengumuman
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pengumuman (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  date        TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample data
INSERT INTO pengumuman (title, content, date) VALUES
  ('Pelaksanaan Kenaikan Pangkat April 2026',
   'Kepada seluruh pegawai yang akan naik pangkat periode April 2026, harap segera melengkapi berkas persyaratan dan mengajukan melalui SIMPEG. Batas waktu pengajuan adalah 28 Februari 2026.',
   NOW()),
  ('Jadwal Kenaikan Gaji Berkala Triwulan I 2026',
   'KGB untuk triwulan pertama tahun 2026 akan diproses pada bulan Januari s.d. Maret 2026. Mohon koordinasikan dengan bagian kepegawaian masing-masing satuan kerja.',
   NOW() - INTERVAL '3 days');

-- ─────────────────────────────────────────────
-- 4. TABEL: gallery
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  image_path  TEXT NOT NULL,   -- path relatif atau URL storage
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. TABEL: tim_kerja
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tim_kerja (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  position    TEXT NOT NULL,
  phone       TEXT,
  photo_path  TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. TABEL: faq
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faq (
  id          SERIAL PRIMARY KEY,
  question    TEXT NOT NULL,
  answer      TEXT,
  is_answered BOOLEAN GENERATED ALWAYS AS (answer IS NOT NULL AND answer <> '') STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 7. TABEL: kp_data (Kenaikan Pangkat — data pegawai)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kp_data (
  id              SERIAL PRIMARY KEY,
  month           TEXT NOT NULL,          -- format: YYYY-MM
  name            TEXT NOT NULL,
  nip             TEXT NOT NULL,
  old_rank        TEXT NOT NULL,
  new_rank        TEXT NOT NULL,
  tanggal_usulan  DATE,
  drive_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. TABEL: kp_requirements (Persyaratan Kenaikan Pangkat)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kp_requirements (
  id          SERIAL PRIMARY KEY,
  text        TEXT NOT NULL,
  note        TEXT,
  sub_items   JSONB DEFAULT '[]',   -- array of strings
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default requirements
INSERT INTO kp_requirements (text, note, sub_items, sort_order) VALUES
  ('Semua PAK mulai pengangkatan awal', NULL, '[]', 1),
  ('SKP PPK 2 tahun terakhir', 'SKP Tahunan terdiri dari 3 dokumen berikut:',
   '["Dokumen Sasaran Kinerja (SKP Penentuan)", "Evaluasi Kinerja (Dokumen Evaluasi)", "Penilaian Kinerja (SKP Penilaian)"]', 2),
  ('Karpeg', NULL, '[]', 3),
  ('SK CPNS', NULL, '[]', 4),
  ('SK PNS', NULL, '[]', 5),
  ('SK KP Terakhir', NULL, '[]', 6),
  ('SK Pengangkatan Pertama JF / SK JF', NULL, '[]', 7),
  ('Surat Persyaratan Pelantikan (SPP) JF', NULL, '[]', 8),
  ('SK Mutasi', 'Jika ada', '[]', 9);

-- ─────────────────────────────────────────────
-- 9. TABEL: kp_jadwal (Jadwal Periode Kenaikan Pangkat)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kp_jadwal (
  id          SERIAL PRIMARY KEY,
  periode     TEXT NOT NULL,
  tanggal     TEXT,
  keterangan  TEXT,
  pdf_url     TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample jadwal
INSERT INTO kp_jadwal (periode, tanggal, keterangan, sort_order) VALUES
  ('Periode April 2026', '1 Januari – 28 Februari 2026', 'Batas waktu pengajuan berkas', 1),
  ('Periode Oktober 2026', '1 Juli – 31 Agustus 2026', 'Batas waktu pengajuan berkas', 2);

-- ─────────────────────────────────────────────
-- 10. TABEL: kgb_data (Kenaikan Gaji Berkala)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kgb_data (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  kabkota     TEXT NOT NULL,
  bulan       TEXT NOT NULL,
  nama        TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kgb_kabkota ON kgb_data(kabkota);
CREATE INDEX IF NOT EXISTS idx_kgb_bulan   ON kgb_data(bulan);

-- ─────────────────────────────────────────────
-- 11. TABEL: uji_kompetensi
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uji_kompetensi (
  id          SERIAL PRIMARY KEY,
  jenis       TEXT NOT NULL CHECK (jenis IN ('Statistisi', 'SDM')),
  periode     TEXT NOT NULL,
  name        TEXT NOT NULL,
  nip         TEXT NOT NULL,
  tanggal     TEXT,
  status      TEXT DEFAULT 'Belum' CHECK (status IN ('Lulus', 'Tidak Lulus', 'Belum')),
  keterangan  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uk_jenis   ON uji_kompetensi(jenis);
CREATE INDEX IF NOT EXISTS idx_uk_periode ON uji_kompetensi(periode);

-- ─────────────────────────────────────────────
-- 12. TABEL: peraturan
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS peraturan (
  id          SERIAL PRIMARY KEY,
  judul       TEXT NOT NULL,
  nomor       TEXT,
  tahun       TEXT,
  kategori    TEXT,
  deskripsi   TEXT,
  url         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample peraturan
INSERT INTO peraturan (judul, nomor, tahun, kategori, deskripsi, url) VALUES
  ('Peraturan Pemerintah tentang Manajemen PNS',
   'PP No. 11 Tahun 2017', '2017', 'Manajemen ASN',
   'Mengatur manajemen PNS meliputi penyusunan dan penetapan kebutuhan, pengadaan, pangkat dan jabatan, serta pemberhentian.',
   'https://peraturan.bpk.go.id/Details/39636/pp-no-11-tahun-2017'),
  ('Peraturan Pemerintah tentang Penilaian Kinerja PNS',
   'PP No. 30 Tahun 2019', '2019', 'Penilaian Kinerja',
   'Mengatur tata cara penilaian kinerja PNS yang berorientasi pada hasil.',
   'https://peraturan.bpk.go.id/Details/110798'),
  ('Peraturan BPS tentang Jabatan Fungsional Statistisi',
   'Perban BPS No. 3 Tahun 2020', '2020', 'Jabatan Fungsional',
   'Petunjuk pelaksanaan jabatan fungsional statistisi dan angka kreditnya.',
   NULL),
  ('Undang-Undang Aparatur Sipil Negara',
   'UU No. 5 Tahun 2014', '2014', 'Manajemen ASN',
   'Landasan hukum pengaturan ASN untuk mewujudkan birokrasi profesional.',
   'https://peraturan.bpk.go.id/Details/38580/uu-no-5-tahun-2014');

-- ─────────────────────────────────────────────
-- 13. TABEL: tugas_belajar_persyaratan
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tugas_belajar_persyaratan (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 14. TABEL: tugas_belajar_dokumen
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tugas_belajar_dokumen (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. TABEL: storage_images (untuk gallery & foto tim)
--     Catatan: Di produksi gunakan Supabase Storage Bucket
-- ─────────────────────────────────────────────
-- Bucket 'images' akan dibuat via API/Dashboard Supabase
-- Tabel ini hanya sebagai referensi metadata tambahan jika dibutuhkan
