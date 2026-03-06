-- ===============================
-- USERS
-- ===============================
CREATE TABLE users (
    id uuid PRIMARY KEY,
    name text,
    email text,
    password text,
    role text,
    created_at timestamp without time zone
);

-- ===============================
-- ROLES
-- ===============================
CREATE TABLE roles (
    id uuid PRIMARY KEY,
    user_id uuid,
    role text,
    created_at timestamp with time zone
);

-- ===============================
-- PEGAWAIS
-- ===============================
CREATE TABLE pegawais (
    id uuid PRIMARY KEY,
    user_id uuid,
    nama text,
    nip text,
    jabatan text,
    unit_kerja text,
    tanggal_lahir date,
    created_at timestamp without time zone
);

-- ===============================
-- TIM KERJA
-- ===============================
CREATE TABLE tim_kerja (
    id uuid PRIMARY KEY,
    nama_tim text,
    deskripsi text,
    created_at timestamp with time zone
);

-- ===============================
-- CUSTOM MENUS
-- ===============================
CREATE TABLE custom_menus (
    id uuid PRIMARY KEY,
    nama_menu text,
    url text,
    icon text,
    urutan smallint,
    created_at timestamp with time zone
);

-- ===============================
-- FAQ
-- ===============================
CREATE TABLE faq (
    id uuid PRIMARY KEY,
    user_id uuid,
    question text,
    answer text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- ===============================
-- GALLERY
-- ===============================
CREATE TABLE gallery (
    id uuid PRIMARY KEY,
    title text,
    image_path text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- ===============================
-- PENGUMUMAN
-- ===============================
CREATE TABLE pengumuman (
    id bigint PRIMARY KEY,
    judul text,
    isi text,
    created_at timestamp with time zone
);

-- ===============================
-- PERATURAN
-- ===============================
CREATE TABLE peraturan (
    id uuid PRIMARY KEY,
    judul text,
    deskripsi text,
    file_url text,
    created_at timestamp with time zone
);

-- ===============================
-- SETTINGS
-- ===============================
CREATE TABLE settings (
    id uuid PRIMARY KEY,
    app_name text,
    version text,
    scrolling_text text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- ===============================
-- JADWAL KP
-- ===============================
CREATE TABLE jadwal_kp (
    id bigint PRIMARY KEY,
    periode text,
    tanggal_mulai date,
    tanggal_selesai date,
    created_at timestamp with time zone
);

-- ===============================
-- KENAIKAN PANGKAT
-- ===============================
CREATE TABLE kenaikan_pangkat (
    id uuid PRIMARY KEY,
    pegawai_id uuid,
    old_rank text,
    new_rank text,
    tanggal_usulan date,
    drive_url text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- ===============================
-- KGB
-- ===============================
CREATE TABLE kgb (
    id uuid PRIMARY KEY,
    pegawai_id uuid,
    bulan text,
    uploaded_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- ===============================
-- KP PERSYARATAN
-- ===============================
CREATE TABLE kp_persyaratan (
    id bigint PRIMARY KEY,
    nama_persyaratan text,
    deskripsi text,
    created_at timestamp with time zone
);

-- ===============================
-- TUGAS BELAJAR PERSYARATAN
-- ===============================
CREATE TABLE tugas_belajar_persyaratan (
    id bigint PRIMARY KEY,
    nama_persyaratan text,
    created_at timestamp with time zone
);

-- ===============================
-- TUGAS BELAJAR DOKUMEN
-- ===============================
CREATE TABLE tugas_belajar_dokumen (
    id uuid PRIMARY KEY,
    pegawai_id uuid,
    nama_dokumen text,
    file_url text,
    created_at timestamp with time zone
);

-- ===============================
-- UJI KOMPETENSI
-- ===============================
CREATE TABLE uji_kompetensi (
    id uuid PRIMARY KEY,
    pegawai_id uuid,
    jenis text,
    status text,
    keterangan text,
    periode integer,
    tanggal date,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);