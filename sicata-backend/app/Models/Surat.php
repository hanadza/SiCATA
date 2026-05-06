<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Surat extends Model
{
    protected $fillable = [
        'nomor',
        'jenis',
        'jenis_label',
        'kat',
        'tgl',
        'tujuan',
        'perihal',
        'isi',
        'sifat',
        'jabatan',
        'nama',
        'scan_surat_path',  // ← Path file scan surat masuk
        'desa',             // ← Desa pemilik surat (scope)
    ];

    protected $casts = [
        'tgl' => 'date',
    ];
}
