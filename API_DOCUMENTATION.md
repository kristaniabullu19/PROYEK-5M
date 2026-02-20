# 📘 API Documentation - Dashboard SDM BPS

Base URL:
```
http://127.0.0.1:8000/api
```

---

# 🔐 Authentication

## 🔹 Register

**POST** `/register`

### Body:
```json
{
  "name": "Admin",
  "email": "admin@mail.com",
  "password": "password",
  "password_confirmation": "password"
}
```

### Response:
```json
{
  "user": {},
  "token": "..."
}
```

---

## 🔹 Login

**POST** `/login`

### Body:
```json
{
  "email": "admin@mail.com",
  "password": "password"
}
```

### Response:
```json
{
  "user": {},
  "token": "..."
}
```

---

## 🔹 Logout

**POST** `/logout`

### Header:
```
Authorization: Bearer {token}
```

---

# 👥 Pegawai

## 🔹 Get All Pegawai

**GET** `/pegawais`

### Header:
```
Authorization: Bearer {token}
```

---

## 🔹 Create Pegawai

**POST** `/pegawais`

### Body:
```json
{
  "nama": "Budi",
  "nip": "123456",
  "jabatan": "Statistisi",
  "unit_kerja": "Produksi",
  "status_kepegawaian": "PNS",
  "tanggal_lahir": "1995-05-10"
}
```

---

## 🔹 Update Pegawai

**PUT** `/pegawais/{id}`

---

## 🔹 Delete Pegawai

**DELETE** `/pegawais/{id}`

---

## 🔹 Statistik Pegawai

**GET** `/pegawais/statistik`

---

# 📢 Pengumuman

## 🔹 Get All Pengumuman

**GET** `/pengumuman`

---

## 🔹 Create Pengumuman

**POST** `/pengumuman`

### Body:
```json
{
  "judul": "Libur Nasional",
  "isi": "Besok libur nasional."
}
```

---

## 🔹 Update Pengumuman

**PUT** `/pengumuman/{id}`

---

## 🔹 Delete Pengumuman

**DELETE** `/pengumuman/{id}`

---

# 🔒 Authentication Notes

Semua endpoint kecuali:
- `/login`
- `/register`

membutuhkan:

```
Authorization: Bearer {token}
```