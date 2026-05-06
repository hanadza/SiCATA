<?php

namespace Database\Seeders;

use App\Models\Surat;
use App\Services\SuratService;
use Illuminate\Database\Seeder;

class SuratSeeder extends Seeder
{
    public function __construct(private SuratService $suratService) {}

    public function run(): void
    {
        $demos = [
            [
                'jenis'   => 'keluar_keterangan',
                'tgl'     => '2025-11-15',
                'tujuan'  => 'Camat Kecamatan Sukamaju',
                'perihal' => 'Permohonan Dana BLT Desa 2025',
                'sifat'   => 'Penting',
                'jabatan' => 'Kepala Desa',
                'nama'    => 'H. Supriyadi, S.IP',
                'isi'     => '',
            ],
            [
                'jenis'   => 'keluar_undangan',
                'tgl'     => '2025-11-20',
                'tujuan'  => 'Seluruh Kepala Dusun',
                'perihal' => 'Undangan Rapat Koordinasi Pembangunan',
                'sifat'   => 'Biasa',
                'jabatan' => 'Kepala Desa',
                'nama'    => 'H. Supriyadi, S.IP',
                'isi'     => '',
            ],
            [
                'jenis'   => 'masuk_dinas',
                'tgl'     => '2025-11-18',
                'tujuan'  => 'Dinas PMD Kabupaten',
                'perihal' => 'Jadwal Evaluasi Program DD 2025',
                'sifat'   => 'Penting',
                'jabatan' => 'Kepala Desa',
                'nama'    => 'H. Supriyadi, S.IP',
                'isi'     => '',
            ],
            [
                'jenis'   => 'keluar_edaran',
                'tgl'     => '2025-12-01',
                'tujuan'  => 'Warga Desa Sukamaju',
                'perihal' => 'Edaran Protokol Kesehatan RT/RW',
                'sifat'   => 'Segera',
                'jabatan' => 'Kepala Desa',
                'nama'    => 'H. Supriyadi, S.IP',
                'isi'     => '',
            ],
            [
                'jenis'   => 'masuk_umum',
                'tgl'     => '2025-12-05',
                'tujuan'  => 'Bank BRI Cabang Sukamaju',
                'perihal' => 'Konfirmasi Pencairan Dana Desa',
                'sifat'   => 'Rahasia',
                'jabatan' => 'Kepala Desa',
                'nama'    => 'H. Supriyadi, S.IP',
                'isi'     => '',
            ],
        ];

        foreach ($demos as $data) {
            $this->suratService->createSurat($data);
        }
    }
}