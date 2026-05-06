<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SuratResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'nomor'      => $this->nomor,
            'jenis'      => $this->jenis,
            'jenisLabel' => $this->jenis_label,
            'kat'        => $this->kat,
            'tgl'        => $this->tgl?->format('Y-m-d'),
            'tujuan'     => $this->tujuan,
            'perihal'    => $this->perihal,
            'isi'        => $this->isi,
            'sifat'      => $this->sifat,
            'jabatan'    => $this->jabatan,
            'nama'       => $this->nama,
            'desa'       => $this->desa,
            // URL publik scan surat (null jika tidak ada scan)
            'scanUrl'    => $this->scan_surat_path
                              ? Storage::disk('public')->url($this->scan_surat_path)
                              : null,
            'createdAt'  => $this->created_at?->toISOString(),
        ];
    }
}
