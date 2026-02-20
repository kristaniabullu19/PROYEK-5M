<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    protected $fillable = [
        'nama',
        'nip',
        'jabatan',
        'unit_kerja',
        'tanggal_lahir',
        'status_kepegawaian'
    ];
}
