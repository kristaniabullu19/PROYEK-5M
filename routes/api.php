<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\PengumumanController;

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (BUTUH LOGIN)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Logout
    Route::post('/logout', [AuthController::class, 'logout']);

    // ===== ROUTE STATISTIK PEGAWAI =====
    Route::get('pegawais/statistik', [PegawaiController::class, 'statistik']);
    Route::get('pegawais/statistik/unit-kerja', [PegawaiController::class, 'statistikUnitKerja']);
    Route::get('pegawais/statistik/jabatan', [PegawaiController::class, 'statistikJabatan']);
    Route::get('pegawais/statistik/usia', [PegawaiController::class, 'statistikUsia']);

    // ===== CRUD PEGAWAI =====
    Route::apiResource('pegawais', PegawaiController::class);

    // ===== CRUD PENGUMUMAN =====
    Route::apiResource('pengumuman', PengumumanController::class);
});
