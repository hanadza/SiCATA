<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin utama ──────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@desa.id'],
            [
                'name'     => 'Admin Desa',
                'password' => Hash::make('password'),
                'role'     => 'admin',
                'telp'     => '081234567890',
                'desa'     => 'Desa Sukamaju',
                'jabatan'  => 'Kepala Desa',
            ]
        );

        // ── Staff / user biasa ────────────────────────
        User::firstOrCreate(
            ['email' => 'staff@desa.id'],
            [
                'name'     => 'Staff Desa',
                'password' => Hash::make('password'),
                'role'     => 'user',
                'telp'     => '081234567891',
                'desa'     => 'Desa Sukamakmur',
                'jabatan'  => 'Staf Administrasi',
            ]
        );
    }
}