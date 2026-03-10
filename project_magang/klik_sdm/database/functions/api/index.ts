// ============================================================
// KLIK-SDM SUPABASE BACKEND
// File: supabase/functions/api/index.ts
// Deskripsi: Edge Function utama — menangani SEMUA endpoint API
// Deploy: supabase functions deploy api
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Tipe data ────────────────────────────────────────────────
interface ApiResponse {
  data?: unknown;
  error?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Content-Type": "application/json",
};

// ── Buat Supabase client dengan service_role (bypass RLS) ────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

// ── Response helper ──────────────────────────────────────────
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: CORS_HEADERS,
  });
}

// ── Validasi token admin ─────────────────────────────────────
async function validateAdmin(
  request: Request,
  supabase: ReturnType<typeof getSupabase>
): Promise<{ valid: boolean; user?: { username: string; role: string } }> {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return { valid: false };

  const token = auth.replace("Bearer ", "");
  // Token format: base64(username:password:role)
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length < 3) return { valid: false };
    const [username, password, role] = parts;

    const { data } = await supabase
      .from("users")
      .select("username, role")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (!data) return { valid: false };
    return { valid: true, user: data };
  } catch {
    return { valid: false };
  }
}

// ════════════════════════════════════════════════════════════
// HANDLER UTAMA
// ════════════════════════════════════════════════════════════
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") || "";
  const method = req.method;
  const supabase = getSupabase();

  let body: Record<string, unknown> = {};
  if (["POST", "PUT", "DELETE"].includes(method)) {
    try {
      body = await req.json();
    } catch {
      // body kosong
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: settings
  // ──────────────────────────────────────────
  if (endpoint === "settings") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value");
      if (error) return errorResponse(error.message);
      // Kembalikan sebagai objek key-value
      const result: Record<string, string> = {};
      (data || []).forEach((row: { key: string; value: string }) => {
        result[row.key] = row.value;
      });
      return jsonResponse(result);
    }

    if (method === "PUT") {
      // Validasi admin
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { scrolling_text } = body as { scrolling_text: string };
      if (!scrolling_text) return errorResponse("scrolling_text wajib diisi");

      const { error } = await supabase
        .from("settings")
        .upsert({ key: "scrolling_text", value: scrolling_text, updated_at: new Date().toISOString() }, { onConflict: "key" });

      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: login
  // ──────────────────────────────────────────
  if (endpoint === "login" && method === "POST") {
    const { username, password } = body as { username: string; password: string };
    if (!username || !password) return errorResponse("Username dan password wajib");

    const { data, error } = await supabase
      .from("users")
      .select("id, username, role")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) return errorResponse("Username atau password tidak valid", 401);

    // Buat token sederhana: base64(username:password:role)
    const token = btoa(`${username}:${password}:${data.role}`);
    return jsonResponse({ username: data.username, role: data.role, token });
  }

  // ──────────────────────────────────────────
  // ROUTE: pengumuman
  // ──────────────────────────────────────────
  if (endpoint === "pengumuman") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("pengumuman")
        .select("id, title, content, date")
        .eq("is_active", true)
        .order("date", { ascending: false });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { title, content } = body as { title: string; content: string };
      if (!title || !content) return errorResponse("Title dan content wajib");

      const { data, error } = await supabase
        .from("pengumuman")
        .insert({ title, content, created_by: auth.user?.username })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase
        .from("pengumuman")
        .update({ is_active: false })
        .eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: gallery
  // ──────────────────────────────────────────
  if (endpoint === "gallery") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("gallery")
        .select("id, title, image_path")
        .order("created_at", { ascending: false });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { title, image } = body as { title: string; image: string };
      if (!title || !image) return errorResponse("Title dan image wajib");

      // Upload gambar ke Supabase Storage
      const imageBuffer = Uint8Array.from(
        atob(image.replace(/^data:image\/\w+;base64,/, "")),
        (c) => c.charCodeAt(0)
      );
      const ext = image.startsWith("data:image/png") ? "png" : "jpg";
      const fileName = `gallery/${Date.now()}.${ext}`;
      const contentType = ext === "png" ? "image/png" : "image/jpeg";

      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(fileName, imageBuffer, { contentType, upsert: false });

      if (uploadErr) return errorResponse("Upload gagal: " + uploadErr.message);

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from("gallery")
        .insert({ title, image_path: urlData.publicUrl })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };

      // Ambil image_path dulu untuk hapus dari storage
      const { data: galleryItem } = await supabase
        .from("gallery")
        .select("image_path")
        .eq("id", id)
        .single();

      if (galleryItem?.image_path) {
        // Ekstrak nama file dari URL
        const urlParts = galleryItem.image_path.split("/storage/v1/object/public/images/");
        if (urlParts[1]) {
          await supabase.storage.from("images").remove([urlParts[1]]);
        }
      }

      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: tim_kerja
  // ──────────────────────────────────────────
  if (endpoint === "tim_kerja") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("tim_kerja")
        .select("id, name, position, phone, photo_path")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { name, position, phone, photo } = body as {
        name: string; position: string; phone: string; photo: string;
      };
      if (!name || !position || !phone || !photo) return errorResponse("Semua field wajib");

      // Upload foto
      const photoBuffer = Uint8Array.from(
        atob(photo.replace(/^data:image\/\w+;base64,/, "")),
        (c) => c.charCodeAt(0)
      );
      const ext = photo.startsWith("data:image/png") ? "png" : "jpg";
      const fileName = `tim/${Date.now()}.${ext}`;
      const contentType = ext === "png" ? "image/png" : "image/jpeg";

      const { error: uploadErr } = await supabase.storage
        .from("images")
        .upload(fileName, photoBuffer, { contentType, upsert: false });
      if (uploadErr) return errorResponse("Upload foto gagal: " + uploadErr.message);

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from("tim_kerja")
        .insert({ name, position, phone, photo_path: urlData.publicUrl })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("tim_kerja").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: faq
  // ──────────────────────────────────────────
  if (endpoint === "faq") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("faq")
        .select("id, question, answer, created_at")
        .order("created_at", { ascending: false });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      // Siapa pun bisa kirim pertanyaan
      const { question } = body as { question: string };
      if (!question) return errorResponse("Pertanyaan wajib diisi");

      const { data, error } = await supabase
        .from("faq")
        .insert({ question })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "PUT") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id, answer } = body as { id: number; answer: string };
      if (!id || !answer) return errorResponse("ID dan answer wajib");

      const { data, error } = await supabase
        .from("faq")
        .update({ answer, answered_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("faq").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: kp_data (Kenaikan Pangkat - Data Pegawai)
  // ──────────────────────────────────────────
  if (endpoint === "kp_data") {
    if (method === "GET") {
      const month = url.searchParams.get("month");
      let query = supabase
        .from("kp_data")
        .select("id, month, name, nip, old_rank, new_rank, tanggal_usulan, drive_url")
        .order("name", { ascending: true });

      if (month) query = query.eq("month", month);

      const { data, error } = await query;
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { month, name, nip, old_rank, new_rank, tanggal_usulan, drive_url } = body as {
        month: string; name: string; nip: string; old_rank: string;
        new_rank: string; tanggal_usulan: string; drive_url: string;
      };
      if (!month || !name || !nip || !old_rank || !new_rank) {
        return errorResponse("Field wajib: month, name, nip, old_rank, new_rank");
      }

      const { data, error } = await supabase
        .from("kp_data")
        .insert({ month, name, nip, old_rank, new_rank, tanggal_usulan: tanggal_usulan || null, drive_url: drive_url || null })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("kp_data").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: kp_requirements
  // ──────────────────────────────────────────
  if (endpoint === "kp_requirements") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("kp_requirements")
        .select("id, text, note, sub_items, sort_order")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse(error.message);
      // Map sub_items ke format yang dipakai frontend
      const result = (data || []).map((r: { id: number; text: string; note: string | null; sub_items: string[]; sort_order: number }) => ({
        id: r.id,
        text: r.text,
        note: r.note,
        sub: r.sub_items || [],
      }));
      return jsonResponse(result);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { text, note, sub } = body as { text: string; note?: string; sub?: string[] };
      if (!text) return errorResponse("text wajib diisi");

      // Hitung sort_order berikutnya
      const { count } = await supabase.from("kp_requirements").select("*", { count: "exact", head: true });

      const { data, error } = await supabase
        .from("kp_requirements")
        .insert({ text, note: note || null, sub_items: sub || [], sort_order: (count || 0) + 1 })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "PUT") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id, text, note, sub } = body as {
        id: number; text: string; note?: string; sub?: string[];
      };
      if (!id || !text) return errorResponse("id dan text wajib");

      const { data, error } = await supabase
        .from("kp_requirements")
        .update({ text, note: note || null, sub_items: sub || [] })
        .eq("id", id)
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("kp_requirements").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: kp_jadwal
  // ──────────────────────────────────────────
  if (endpoint === "kp_jadwal") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("kp_jadwal")
        .select("id, periode, tanggal, keterangan, pdf_url")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse(error.message);
      // Map ke format yang dipakai frontend
      const result = (data || []).map((r: { id: number; periode: string; tanggal: string; keterangan: string; pdf_url: string }) => ({
        ...r,
        pdfUrl: r.pdf_url,
      }));
      return jsonResponse(result);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { periode, tanggal, keterangan, pdfUrl } = body as {
        periode: string; tanggal?: string; keterangan?: string; pdfUrl?: string;
      };
      if (!periode) return errorResponse("periode wajib");

      const { count } = await supabase.from("kp_jadwal").select("*", { count: "exact", head: true });

      const { data, error } = await supabase
        .from("kp_jadwal")
        .insert({
          periode,
          tanggal: tanggal || null,
          keterangan: keterangan || null,
          pdf_url: pdfUrl || null,
          sort_order: (count || 0) + 1,
        })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("kp_jadwal").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: kgb_data (Kenaikan Gaji Berkala)
  // ──────────────────────────────────────────
  if (endpoint === "kgb_data") {
    if (method === "GET") {
      const bulan = url.searchParams.get("bulan");
      const kabkota = url.searchParams.get("kabkota");
      const search = url.searchParams.get("search");

      let query = supabase
        .from("kgb_data")
        .select("id, kabkota, bulan, nama, uploaded_at")
        .order("nama", { ascending: true });

      if (bulan) query = query.eq("bulan", bulan);
      if (kabkota) query = query.eq("kabkota", kabkota);
      if (search) query = query.ilike("nama", `%${search}%`);

      const { data, error } = await query;
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      // Bulk insert: menggantikan data lama untuk kabkota+bulan yang sama
      const { kabkota, bulan, rows } = body as {
        kabkota: string;
        bulan: string;
        rows: string[]; // array of nama pegawai
      };

      if (!kabkota || !bulan || !rows?.length) {
        return errorResponse("kabkota, bulan, dan rows wajib diisi");
      }

      // Hapus data lama untuk kabkota+bulan yang sama
      await supabase
        .from("kgb_data")
        .delete()
        .eq("kabkota", kabkota)
        .eq("bulan", bulan);

      // Insert data baru
      const insertData = rows.map((nama: string) => ({
        kabkota,
        bulan,
        nama,
        uploaded_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("kgb_data")
        .insert(insertData)
        .select();
      if (error) return errorResponse(error.message);
      return jsonResponse({ inserted: data?.length || 0, success: true }, 201);
    }

    if (method === "DELETE") {
      const { id } = body as { id: string };
      if (!id) return errorResponse("id wajib");
      const { error } = await supabase.from("kgb_data").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: uji_kompetensi
  // ──────────────────────────────────────────
  if (endpoint === "uji_kompetensi") {
    if (method === "GET") {
      const jenis = url.searchParams.get("jenis");
      const periode = url.searchParams.get("periode");

      let query = supabase
        .from("uji_kompetensi")
        .select("id, jenis, periode, name, nip, tanggal, status, keterangan")
        .order("name", { ascending: true });

      if (jenis) query = query.eq("jenis", jenis);
      if (periode) query = query.eq("periode", periode);

      const { data, error } = await query;
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { jenis, periode, name, nip, tanggal, status, keterangan } = body as {
        jenis: string; periode: string; name: string; nip: string;
        tanggal?: string; status?: string; keterangan?: string;
      };
      if (!jenis || !periode || !name || !nip) {
        return errorResponse("jenis, periode, name, nip wajib");
      }

      const { data, error } = await supabase
        .from("uji_kompetensi")
        .insert({ jenis, periode, name, nip, tanggal: tanggal || null, status: status || "Belum", keterangan: keterangan || null })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("uji_kompetensi").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: peraturan
  // ──────────────────────────────────────────
  if (endpoint === "peraturan") {
    if (method === "GET") {
      const search = url.searchParams.get("search");
      const kategori = url.searchParams.get("kategori");

      let query = supabase
        .from("peraturan")
        .select("id, judul, nomor, tahun, kategori, deskripsi, url")
        .order("created_at", { ascending: false });

      if (kategori) query = query.eq("kategori", kategori);
      if (search) query = query.or(`judul.ilike.%${search}%,nomor.ilike.%${search}%,deskripsi.ilike.%${search}%`);

      const { data, error } = await query;
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { judul, nomor, tahun, kategori, deskripsi, url: docUrl } = body as {
        judul: string; nomor?: string; tahun?: string;
        kategori?: string; deskripsi?: string; url?: string;
      };
      if (!judul) return errorResponse("judul wajib");

      const { data, error } = await supabase
        .from("peraturan")
        .insert({ judul, nomor: nomor || null, tahun: tahun || null, kategori: kategori || null, deskripsi: deskripsi || null, url: docUrl || null })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("peraturan").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: tugas_belajar_persyaratan
  // ──────────────────────────────────────────
  if (endpoint === "tb_persyaratan") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("tugas_belajar_persyaratan")
        .select("id, title, description, url")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { title, description, url: docUrl } = body as {
        title: string; description?: string; url: string;
      };
      if (!title || !docUrl) return errorResponse("title dan url wajib");

      const { count } = await supabase.from("tugas_belajar_persyaratan").select("*", { count: "exact", head: true });
      const { data, error } = await supabase
        .from("tugas_belajar_persyaratan")
        .insert({ title, description: description || null, url: docUrl, sort_order: (count || 0) + 1 })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("tugas_belajar_persyaratan").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // ROUTE: tugas_belajar_dokumen
  // ──────────────────────────────────────────
  if (endpoint === "tb_dokumen") {
    if (method === "GET") {
      const { data, error } = await supabase
        .from("tugas_belajar_dokumen")
        .select("id, title, description, url")
        .order("sort_order", { ascending: true });
      if (error) return errorResponse(error.message);
      return jsonResponse(data || []);
    }

    if (method === "POST") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { title, description, url: docUrl } = body as {
        title: string; description?: string; url: string;
      };
      if (!title || !docUrl) return errorResponse("title dan url wajib");

      const { count } = await supabase.from("tugas_belajar_dokumen").select("*", { count: "exact", head: true });
      const { data, error } = await supabase
        .from("tugas_belajar_dokumen")
        .insert({ title, description: description || null, url: docUrl, sort_order: (count || 0) + 1 })
        .select()
        .single();
      if (error) return errorResponse(error.message);
      return jsonResponse(data, 201);
    }

    if (method === "DELETE") {
      const auth = await validateAdmin(req, supabase);
      if (!auth.valid) return errorResponse("Unauthorized", 401);

      const { id } = body as { id: number };
      const { error } = await supabase.from("tugas_belajar_dokumen").delete().eq("id", id);
      if (error) return errorResponse(error.message);
      return jsonResponse({ success: true });
    }
  }

  // ──────────────────────────────────────────
  // 404 — endpoint tidak ditemukan
  // ──────────────────────────────────────────
  return errorResponse(`Endpoint '${endpoint}' tidak ditemukan`, 404);
});
