<?php

namespace App\Services;

use App\Models\Surat;
use Illuminate\Support\Facades\DB;

class SuratService
{
    // ── Peta jenis surat → kode & label ──────────────────────────
    private const KODE_MAP = [
        'keluar_keterangan' => ['kode' => 'SK',  'label' => 'Surat Keterangan',        'kat' => 'keluar'],
        'keluar_undangan'   => ['kode' => 'SU',  'label' => 'Surat Undangan',          'kat' => 'keluar'],
        'keluar_permohonan' => ['kode' => 'SP',  'label' => 'Surat Permohonan',        'kat' => 'keluar'],
        'keluar_pengantar'  => ['kode' => 'SPG', 'label' => 'Surat Pengantar',         'kat' => 'keluar'],
        'keluar_keputusan'  => ['kode' => 'SKP', 'label' => 'Surat Keputusan',         'kat' => 'keluar'],
        'keluar_edaran'     => ['kode' => 'SE',  'label' => 'Surat Edaran',            'kat' => 'keluar'],
        'masuk_keterangan'  => ['kode' => 'SK',  'label' => 'Surat Keterangan',        'kat' => 'masuk'],
        'masuk_undangan'    => ['kode' => 'SU',  'label' => 'Surat Undangan',          'kat' => 'masuk'],
        'masuk_permohonan'  => ['kode' => 'SP',  'label' => 'Surat Permohonan',        'kat' => 'masuk'],
        'masuk_pengantar'   => ['kode' => 'SPG', 'label' => 'Surat Pengantar',         'kat' => 'masuk'],
        'masuk_keputusan'   => ['kode' => 'SKP', 'label' => 'Surat Keputusan',         'kat' => 'masuk'],
        'masuk_edaran'      => ['kode' => 'SE',  'label' => 'Surat Edaran',            'kat' => 'masuk'],
        // Backward compat — old masuk types
        'masuk_umum'        => ['kode' => 'SM',  'label' => 'Surat Masuk Umum',        'kat' => 'masuk'],
        'masuk_dinas'       => ['kode' => 'SMD', 'label' => 'Surat Masuk Dinas',       'kat' => 'masuk'],
    ];

    private const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

    // ─────────────────────────────────────────────────────────────
    // PUBLIC METHODS
    // ─────────────────────────────────────────────────────────────

    /**
     * Ambil daftar surat dengan filter & pagination.
     * Wajib ada $filters['desa'] untuk scope per-desa.
     */
    public function getSuratList(array $filters): array
    {
        $limit = (int) ($filters['limit'] ?? 10);
        $page  = (int) ($filters['page']  ?? 1);

        $query = Surat::query()->orderByDesc('tgl')->orderByDesc('id');

        // ── Scope per desa (wajib) ────────────────────────────
        if (!empty($filters['desa'])) {
            $query->where('desa', $filters['desa']);
        }

        // ── Filter pencarian ──────────────────────────────────
        if (!empty($filters['search'])) {
            $kw = $filters['search'];
            $query->where(function ($q) use ($kw) {
                $q->where('nomor',    'like', "%{$kw}%")
                  ->orWhere('perihal', 'like', "%{$kw}%")
                  ->orWhere('tujuan',  'like', "%{$kw}%");
            });
        }

        if (!empty($filters['kat']) && $filters['kat'] !== 'semua') {
            $query->where('kat', $filters['kat']);
        }

        if (!empty($filters['sifat']) && $filters['sifat'] !== 'semua') {
            $query->where('sifat', $filters['sifat']);
        }

        if (!empty($filters['tgl_dari'])) {
            $query->whereDate('tgl', '>=', $filters['tgl_dari']);
        }

        if (!empty($filters['tgl_sampai'])) {
            $query->whereDate('tgl', '<=', $filters['tgl_sampai']);
        }

        $total      = $query->count();
        $items      = $query->skip(($page - 1) * $limit)->take($limit)->get();
        $totalPages = (int) ceil($total / $limit);

        return [
            'data'       => $items,
            'total'      => $total,
            'page'       => $page,
            'limit'      => $limit,
            'totalPages' => $totalPages,
        ];
    }

    /**
     * Ambil surat berdasarkan ID (tanpa scope desa — sudah difilter di controller).
     */
    public function getSuratById(int $id): Surat
    {
        return Surat::findOrFail($id);
    }

    /**
     * Buat surat baru. Mendukung:
     * - scan_surat_path (file upload dari controller)
     * - desa (dari user yang login)
     */
    public function createSurat(array $data): Surat
    {
        return DB::transaction(function () use ($data) {
            $info  = $this->getJenisInfo($data['jenis']);
            $nomor = $this->generateNomor($data['jenis'], $data['tgl'], $data['desa'] ?? null);

            return Surat::create([
                'nomor'           => $nomor,
                'jenis'           => $data['jenis'],
                'jenis_label'     => $info['label'],
                'kat'             => $info['kat'],
                'tgl'             => $data['tgl'],
                'tujuan'          => $data['tujuan'],
                'perihal'         => $data['perihal'],
                'isi'             => $data['isi']             ?? null,
                'sifat'           => $data['sifat']           ?? 'Biasa',
                'jabatan'         => $data['jabatan'],
                'nama'            => $data['nama'],
                'scan_surat_path' => $data['scan_surat_path'] ?? null,
                'desa'            => $data['desa']            ?? null,
            ]);
        });
    }

    /**
     * Hapus surat berdasarkan ID.
     */
    public function deleteSurat(int $id): void
    {
        Surat::findOrFail($id)->delete();
    }

    /**
     * Preview nomor surat tanpa menyimpan.
     */
    public function previewNomor(string $jenis, string $tgl, ?string $desa = null): array
    {
        $info  = $this->getJenisInfo($jenis);
        $nomor = $this->generateNomor($jenis, $tgl, $desa, preview: true);

        return [
            'nomor'      => $nomor,
            'jenisLabel' => $info['label'],
            'kat'        => $info['kat'],
        ];
    }

    /**
     * Statistik dashboard — scope per desa.
     */
    public function getStats(?string $desa = null): array
    {
        $now   = now();
        $bulan = (int) $now->format('m');
        $tahun = (int) $now->format('Y');

        $base = Surat::query();
        if ($desa) $base->where('desa', $desa);

        $total    = (clone $base)->count();
        $masuk    = (clone $base)->where('kat', 'masuk')->count();
        $keluar   = (clone $base)->where('kat', 'keluar')->count();
        $bulanIni = (clone $base)->whereMonth('tgl', $bulan)->whereYear('tgl', $tahun)->count();

        // Hitung per bulan 12 bulan terakhir
        $monthly = [];
        for ($i = 11; $i >= 0; $i--) {
            $d   = now()->subMonths($i);
            $key = $d->format('Y-m');
            $m   = (int) $d->format('m');
            $y   = (int) $d->format('Y');

            $monthly[$key] = [
                'masuk'  => (clone $base)->where('kat', 'masuk')->whereMonth('tgl', $m)->whereYear('tgl', $y)->count(),
                'keluar' => (clone $base)->where('kat', 'keluar')->whereMonth('tgl', $m)->whereYear('tgl', $y)->count(),
            ];
        }

        return [
            'total'   => $total,
            'masuk'   => $masuk,
            'keluar'  => $keluar,
            'bulan'   => $bulanIni,
            'monthly' => $monthly,
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    private function getJenisInfo(string $jenis): array
    {
        if (!isset(self::KODE_MAP[$jenis])) {
            throw new \InvalidArgumentException("Jenis surat '{$jenis}' tidak valid.");
        }
        return self::KODE_MAP[$jenis];
    }

    /**
     * Generate nomor surat otomatis, scope per-desa.
     * Format: 001/SK/DS-[KODE_DESA]/XI/2025
     */
    private function generateNomor(string $jenis, string $tgl, ?string $desa = null, bool $preview = false): string
    {
        $info  = $this->getJenisInfo($jenis);
        $date  = \Carbon\Carbon::parse($tgl);
        $bulan = (int) $date->format('m');
        $tahun = (int) $date->format('Y');

        // Hitung urutan dalam scope desa + jenis + bulan + tahun
        $q = Surat::where('jenis', $jenis)
            ->whereMonth('tgl', $bulan)
            ->whereYear('tgl', $tahun);
        if ($desa) $q->where('desa', $desa);

        $count  = $q->count();
        $urutan = $count + 1;

        $nomorUrut = str_pad($urutan, 3, '0', STR_PAD_LEFT);
        $romawi    = self::ROMAWI[$bulan];

        // Kode desa: ambil 3 huruf pertama dari nama desa (uppercase), default SKJ
        $kodeDesa = $desa
            ? strtoupper(preg_replace('/[^A-Za-z]/', '', substr($desa, 0, 3)))
            : 'SKJ';

        return "{$nomorUrut}/{$info['kode']}/DS-{$kodeDesa}/{$romawi}/{$tahun}";
    }
}
