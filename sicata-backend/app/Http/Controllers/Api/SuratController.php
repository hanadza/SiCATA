<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuratResource;
use App\Models\Surat;
use App\Services\SuratService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SuratController extends Controller
{
    public function __construct(private readonly SuratService $suratService) {}

    /**
     * GET /api/surat
     * Daftar surat dengan filter & pagination.
     * User biasa hanya melihat surat milik desanya sendiri.
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['search', 'kat', 'sifat', 'tgl_dari', 'tgl_sampai', 'limit', 'page']);

        // Filter per desa (scope ke desa user yang login)
        $params['desa'] = $request->user()->desa;

        $result = $this->suratService->getSuratList($params);

        return response()->json([
            'data'       => SuratResource::collection($result['data']),
            'total'      => $result['total'],
            'page'       => $result['page'],
            'limit'      => $result['limit'],
            'totalPages' => $result['totalPages'],
        ]);
    }

    /**
     * GET /api/surat/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $surat = Surat::where('id', $id)
            ->where('desa', $request->user()->desa)
            ->firstOrFail();

        return response()->json(new SuratResource($surat));
    }

    /**
     * POST /api/surat/keluar
     * Buat surat keluar (JSON biasa, tanpa upload file).
     */
    public function storeSuratKeluar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jenis'   => ['required', 'string', Rule::in([
                'keluar_keterangan','keluar_undangan','keluar_permohonan',
                'keluar_pengantar','keluar_keputusan','keluar_edaran',
            ])],
            'tgl'     => ['required', 'date'],
            'tujuan'  => ['required', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:255'],
            'isi'     => ['nullable', 'string'],
            'sifat'   => ['required', Rule::in(['Biasa','Penting','Segera','Rahasia'])],
            'jabatan' => ['required', 'string'],
            'nama'    => ['required', 'string'],
        ]);

        $validated['desa'] = $request->user()->desa;

        $surat = $this->suratService->createSurat($validated);

        return response()->json(new SuratResource($surat), 201);
    }

    /**
     * POST /api/surat/masuk
     * Buat surat masuk — bisa dengan upload scan (multipart/form-data).
     */
    public function storeSuratMasuk(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'jenis'      => ['required', 'string', Rule::in([
                'masuk_keterangan','masuk_undangan','masuk_permohonan',
                'masuk_pengantar','masuk_keputusan','masuk_edaran',
            ])],
            'tgl'        => ['required', 'date'],
            'tujuan'     => ['required', 'string', 'max:255'],
            'perihal'    => ['required', 'string', 'max:255'],
            'isi'        => ['nullable', 'string'],
            'sifat'      => ['required', Rule::in(['Biasa','Penting','Segera','Rahasia'])],
            'jabatan'    => ['required', 'string'],
            'nama'       => ['required', 'string'],
            'scan_surat' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        $validated['desa'] = $request->user()->desa;

        // Handle upload scan surat
        if ($request->hasFile('scan_surat')) {
            $path = $request->file('scan_surat')->store(
                'scan-surat/' . $request->user()->desa,
                'public'
            );
            $validated['scan_surat_path'] = $path;
        }

        $surat = $this->suratService->createSurat($validated);

        return response()->json(new SuratResource($surat), 201);
    }

    /**
     * POST /api/surat (legacy — masih support untuk backward compat)
     * Otomatis route ke masuk/keluar berdasarkan jenis.
     */
    public function store(Request $request): JsonResponse
    {
        $jenis = $request->input('jenis', '');
        if (str_starts_with($jenis, 'masuk')) {
            return $this->storeSuratMasuk($request);
        }
        return $this->storeSuratKeluar($request);
    }

    /**
     * DELETE /api/surat/{id}
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $surat = Surat::where('id', $id)
            ->where('desa', $request->user()->desa)
            ->firstOrFail();

        // Hapus file scan kalau ada
        if ($surat->scan_surat_path) {
            Storage::disk('public')->delete($surat->scan_surat_path);
        }

        $surat->delete();

        return response()->json(['message' => 'Surat berhasil dihapus.']);
    }

    /**
     * GET /api/nomor-preview
     */
    public function nomorPreview(Request $request): JsonResponse
    {
        $jenis = $request->query('jenis');
        $tgl   = $request->query('tgl', now()->format('Y-m-d'));
        if (!$jenis) {
            return response()->json(['nomor' => null]);
        }
        try {
            $desa    = $request->user()->desa;
            $preview = $this->suratService->previewNomor($jenis, $tgl, $desa);
            return response()->json($preview);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
