<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Tambah kolom scan_surat_path ke tabel surats
 * dan pastikan kolom desa ada untuk scope per desa.
 *
 * Jalankan: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        // Tambah scan_surat_path ke tabel surats
        Schema::table('surats', function (Blueprint $table) {
            // Path file scan surat masuk (disimpan di storage/app/public/scan-surat/)
            $table->string('scan_surat_path')->nullable()->after('nama');
            // Desa pemilik surat (untuk scope per-desa)
            $table->string('desa')->nullable()->after('scan_surat_path');
        });

        // Pastikan kolom desa di users bersifat UNIQUE (1 akun per desa)
        // Cek dulu apakah index unique sudah ada
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('desa', 'users_desa_unique');
            });
        } catch (\Exception $e) {
            // Index sudah ada, skip
        }
    }

    public function down(): void
    {
        Schema::table('surats', function (Blueprint $table) {
            $table->dropColumn(['scan_surat_path', 'desa']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_desa_unique');
        });
    }
};
