<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PegawaiController;

Route::get('/', function () {
    return response()->json([
        'message' => 'Backend SDM BPS Sulut aktif 👑🔥'
    ]);
});