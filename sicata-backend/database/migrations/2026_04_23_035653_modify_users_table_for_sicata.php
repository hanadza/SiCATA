<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Kolom 'name' sudah ada dari default Laravel
            $table->string('role')->default('user')->after('name');        // 'admin' | 'user'
            $table->string('telp')->nullable()->after('email');
            $table->string('desa')->default('Desa Sukamaju')->after('telp');
            $table->string('jabatan')->nullable()->after('desa');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'telp', 'desa', 'jabatan']);
        });
    }
};