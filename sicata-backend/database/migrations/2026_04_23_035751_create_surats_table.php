<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surats', function (Blueprint $table) {
            $table->id();
            $table->string('nomor')->unique();          // Nomor surat unik
            $table->string('jenis');                    // Misal: keluar_keterangan
            $table->string('jenis_label');              // Misal: Surat Keterangan
            $table->enum('kat', ['masuk', 'keluar']);   // Kategori surat
            $table->date('tgl');                        // Tanggal surat
            $table->string('tujuan');                   // Kepada / Dari
            $table->string('perihal');                  // Perihal surat
            $table->text('isi')->nullable();            // Isi keterangan singkat
            $table->string('sifat')->default('Biasa');  // Biasa/Penting/Segera/Rahasia
            $table->string('jabatan');                  // Jabatan penanda tangan
            $table->string('nama');                     // Nama penanda tangan
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surats');
    }
};