<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PegawaiController extends Controller
{
    // ===============================
    // GET /api/pegawais
    // ===============================
    public function index()
    {
        $pegawais = Pegawai::latest()->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diambil',
            'data' => $pegawais
        ]);
    }

    // ===============================
    // GET /api/pegawais/statistik
    // ===============================
    public function statistik()
    {
        return response()->json([
            'success' => true,
            'message' => 'Data statistik pegawai berhasil diambil',
            'data' => [
                'total_pegawai' => Pegawai::count(),
                'total_pns' => Pegawai::where('status_kepegawaian', 'PNS')->count(),
                'total_pppk' => Pegawai::where('status_kepegawaian', 'PPPK')->count(),
                'total_honorer' => Pegawai::where('status_kepegawaian', 'Honorer')->count(),
            ]
        ]);
    }

    // ===============================
    // GET /api/pegawais/statistik/unit-kerja
    // ===============================
    public function statistikUnitKerja()
    {
        $data = Pegawai::selectRaw('unit_kerja, COUNT(*) as total')
            ->groupBy('unit_kerja')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Statistik berdasarkan unit kerja',
            'data' => $data
        ]);
    }

    // ===============================
    // GET /api/pegawais/statistik/jabatan
    // ===============================
    public function statistikJabatan()
    {
        $data = Pegawai::selectRaw('jabatan, COUNT(*) as total')
            ->groupBy('jabatan')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Statistik berdasarkan jabatan',
            'data' => $data
        ]);
    }

    // ===============================
    // GET /api/pegawais/statistik/usia
    // ===============================
    public function statistikUsia()
    {
        $pegawais = Pegawai::all();

        $usiaKelompok = [
            '20-30' => 0,
            '31-40' => 0,
            '41-50' => 0,
            '51+' => 0,
        ];

        foreach ($pegawais as $pegawai) {
            $usia = Carbon::parse($pegawai->tanggal_lahir)->age;

            if ($usia >= 20 && $usia <= 30) {
                $usiaKelompok['20-30']++;
            } elseif ($usia <= 40) {
                $usiaKelompok['31-40']++;
            } elseif ($usia <= 50) {
                $usiaKelompok['41-50']++;
            } else {
                $usiaKelompok['51+']++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Statistik usia pegawai',
            'data' => $usiaKelompok
        ]);
    }

    // ===============================
    // POST /api/pegawais
    // ===============================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nip' => 'required|string|max:50|unique:pegawais,nip',
            'jabatan' => 'required|string|max:255',
            'unit_kerja' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'status_kepegawaian' => 'required|string|max:100'
        ]);

        $pegawai = Pegawai::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil ditambahkan',
            'data' => $pegawai
        ], 201);
    }

    // ===============================
    // GET /api/pegawais/{pegawai}
    // ===============================
    public function show(Pegawai $pegawai)
    {
        return response()->json([
            'success' => true,
            'message' => 'Detail pegawai',
            'data' => $pegawai
        ]);
    }

    // ===============================
    // PUT /api/pegawais/{pegawai}
    // ===============================
    public function update(Request $request, Pegawai $pegawai)
    {
        $validated = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'nip' => 'sometimes|required|string|max:50|unique:pegawais,nip,' . $pegawai->id,
            'jabatan' => 'sometimes|required|string|max:255',
            'unit_kerja' => 'sometimes|required|string|max:255',
            'tanggal_lahir' => 'sometimes|required|date',
            'status_kepegawaian' => 'sometimes|required|string|max:100'
        ]);

        $pegawai->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil diperbarui',
            'data' => $pegawai
        ]);
    }

    // ===============================
    // DELETE /api/pegawais/{pegawai}
    // ===============================
    public function destroy(Pegawai $pegawai)
    {
        $pegawai->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pegawai berhasil dihapus'
        ]);
    }
}
