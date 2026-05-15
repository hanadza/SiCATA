<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreSuratRequest extends FormRequest
{
    /**
     * Hanya admin yang boleh membuat surat.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'jenis'   => ['required', 'string', 'in:keluar_keterangan,keluar_undangan,keluar_permohonan,keluar_pengantar,keluar_keputusan,keluar_edaran,masuk_keterangan,masuk_undangan,masuk_permohonan,masuk_pengantar,masuk_keputusan,masuk_edaran'],
            'tgl'     => ['required', 'date'],
            'tujuan'  => ['required', 'string', 'max:255'],
            'perihal' => ['required', 'string', 'max:500'],
            'isi'     => ['nullable', 'string'],
            'sifat'   => ['required', 'string', 'in:Biasa,Penting,Segera,Rahasia'],
            'jabatan' => ['required', 'string', 'max:100'],
            'nama'    => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'jenis.required'   => 'Jenis surat wajib dipilih.',
            'jenis.in'         => 'Jenis surat tidak valid.',
            'tgl.required'     => 'Tanggal surat wajib diisi.',
            'tgl.date'         => 'Format tanggal tidak valid.',
            'tujuan.required'  => 'Tujuan/pengirim surat wajib diisi.',
            'perihal.required' => 'Perihal surat wajib diisi.',
            'sifat.in'         => 'Sifat surat harus salah satu dari: Biasa, Penting, Segera, Rahasia.',
            'jabatan.required' => 'Jabatan penanda tangan wajib diisi.',
            'nama.required'    => 'Nama penanda tangan wajib diisi.',
        ];
    }

    /**
     * Override: kembalikan respons JSON saat otorisasi gagal.
     */
    protected function failedAuthorization(): never
    {
        throw new HttpResponseException(
            response()->json(['message' => 'Akses ditolak. Hanya Admin yang dapat membuat surat.'], 403)
        );
    }

    /**
     * Override: kembalikan respons JSON saat validasi gagal.
     */
    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'message' => 'Data tidak valid.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}