-- ============================================================
-- KLIK-SDM SUPABASE BACKEND
-- File: 02_rls_policies.sql
-- Deskripsi: Row Level Security — mengatur siapa bisa akses apa
-- ============================================================

-- ─────────────────────────────────────────────
-- CATATAN ARSITEKTUR:
-- Aplikasi ini menggunakan Supabase Edge Functions sebagai
-- API layer (tidak langsung dari client ke tabel).
-- RLS di bawah ini membatasi akses hanya dari service_role
-- (digunakan Edge Functions), bukan anon key langsung.
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengumuman            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tim_kerja             ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kp_data               ENABLE ROW LEVEL SECURITY;
ALTER TABLE kp_requirements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kp_jadwal             ENABLE ROW LEVEL SECURITY;
ALTER TABLE kgb_data              ENABLE ROW LEVEL SECURITY;
ALTER TABLE uji_kompetensi        ENABLE ROW LEVEL SECURITY;
ALTER TABLE peraturan             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas_belajar_persyaratan ENABLE ROW LEVEL SECURITY;
ALTER TABLE tugas_belajar_dokumen     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- POLICY: service_role bypass semua RLS
-- (Edge Functions menggunakan service_role key)
-- ─────────────────────────────────────────────

-- Settings: semua bisa baca, hanya service_role yg bisa tulis
CREATE POLICY "public_read_settings"
  ON settings FOR SELECT USING (true);
CREATE POLICY "service_write_settings"
  ON settings FOR ALL USING (auth.role() = 'service_role');

-- Users: hanya service_role
CREATE POLICY "service_only_users"
  ON users FOR ALL USING (auth.role() = 'service_role');

-- Pengumuman: public baca, service_role tulis
CREATE POLICY "public_read_pengumuman"
  ON pengumuman FOR SELECT USING (is_active = TRUE);
CREATE POLICY "service_write_pengumuman"
  ON pengumuman FOR ALL USING (auth.role() = 'service_role');

-- Gallery: public baca, service_role tulis
CREATE POLICY "public_read_gallery"
  ON gallery FOR SELECT USING (true);
CREATE POLICY "service_write_gallery"
  ON gallery FOR ALL USING (auth.role() = 'service_role');

-- Tim Kerja: public baca, service_role tulis
CREATE POLICY "public_read_tim"
  ON tim_kerja FOR SELECT USING (true);
CREATE POLICY "service_write_tim"
  ON tim_kerja FOR ALL USING (auth.role() = 'service_role');

-- FAQ: public baca & insert (kirim pertanyaan), service_role full
CREATE POLICY "public_read_faq"
  ON faq FOR SELECT USING (true);
CREATE POLICY "public_insert_faq"
  ON faq FOR INSERT WITH CHECK (true);
CREATE POLICY "service_write_faq"
  ON faq FOR ALL USING (auth.role() = 'service_role');

-- KP Data: public baca, service_role tulis
CREATE POLICY "public_read_kp_data"
  ON kp_data FOR SELECT USING (true);
CREATE POLICY "service_write_kp_data"
  ON kp_data FOR ALL USING (auth.role() = 'service_role');

-- KP Requirements: public baca, service_role tulis
CREATE POLICY "public_read_kp_req"
  ON kp_requirements FOR SELECT USING (true);
CREATE POLICY "service_write_kp_req"
  ON kp_requirements FOR ALL USING (auth.role() = 'service_role');

-- KP Jadwal: public baca, service_role tulis
CREATE POLICY "public_read_kp_jadwal"
  ON kp_jadwal FOR SELECT USING (true);
CREATE POLICY "service_write_kp_jadwal"
  ON kp_jadwal FOR ALL USING (auth.role() = 'service_role');

-- KGB Data: public baca, service_role tulis
CREATE POLICY "public_read_kgb"
  ON kgb_data FOR SELECT USING (true);
CREATE POLICY "service_write_kgb"
  ON kgb_data FOR ALL USING (auth.role() = 'service_role');

-- Uji Kompetensi: public baca, service_role tulis
CREATE POLICY "public_read_uk"
  ON uji_kompetensi FOR SELECT USING (true);
CREATE POLICY "service_write_uk"
  ON uji_kompetensi FOR ALL USING (auth.role() = 'service_role');

-- Peraturan: public baca, service_role tulis
CREATE POLICY "public_read_peraturan"
  ON peraturan FOR SELECT USING (true);
CREATE POLICY "service_write_peraturan"
  ON peraturan FOR ALL USING (auth.role() = 'service_role');

-- Tugas Belajar: public baca, service_role tulis
CREATE POLICY "public_read_tb_per"
  ON tugas_belajar_persyaratan FOR SELECT USING (true);
CREATE POLICY "service_write_tb_per"
  ON tugas_belajar_persyaratan FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "public_read_tb_dok"
  ON tugas_belajar_dokumen FOR SELECT USING (true);
CREATE POLICY "service_write_tb_dok"
  ON tugas_belajar_dokumen FOR ALL USING (auth.role() = 'service_role');
