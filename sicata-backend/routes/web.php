<?php

use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

Route::get('/', function () {
    return response()->json(['status' => 'SiCATA Backend OK']);
});

// ── Cek apakah Google OAuth sudah dikonfigurasi ───────────────
Route::get('/api/check-google', function () {
    $configured = !empty(config('services.google.client_id'))
               && config('services.google.client_id') !== 'your-client-id';
    return response()->json(['configured' => $configured]);
});

// ── Google OAuth ──────────────────────────────────────────────
Route::get('/auth/google', function () {
    // Cek konfigurasi dulu
    if (empty(config('services.google.client_id'))
        || config('services.google.client_id') === 'your-client-id') {
        // Redirect ke frontend dengan pesan error
        $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:5500');
        return redirect($frontendUrl . '/login.html?google_error=not_configured');
    }
    return Socialite::driver('google')->redirect();
});

Route::get('/auth/google/callback', function () {
    $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:5500');

    try {
        $gUser = Socialite::driver('google')->stateless()->user();
    } catch (\Exception $e) {
        return redirect($frontendUrl . '/login.html?google_error=callback_failed');
    }

    // Cari user berdasarkan email
    $user = User::where('email', $gUser->getEmail())->first();

    if (!$user) {
        // Buat akun baru — desa dikosongkan dulu, user bisa isi nanti di profil
        $user = User::create([
            'name'     => $gUser->getName(),
            'email'    => $gUser->getEmail(),
            'password' => Hash::make(Str::random(32)),
            'desa'     => '',   // User Google harus isi desa di profil
            'jabatan'  => 'Kepala Desa',
            'role'     => 'user',
            'google_id' => $gUser->getId(),
        ]);
    }

    // Hapus token lama
    $user->tokens()->where('name', 'sicata-app')->delete();
    $token = $user->createToken('sicata-app')->plainTextToken;

    $userData = urlencode(json_encode([
        'id'      => $user->id,
        'nama'    => $user->name,
        'email'   => $user->email,
        'role'    => $user->role,
        'desa'    => $user->desa,
        'jabatan' => $user->jabatan,
    ]));

    // Redirect ke frontend dengan token di query string
    return redirect("{$frontendUrl}/login.html?token={$token}&user={$userData}");
});

// ── JALUR RAHASIA PEMBUAT ADMIN ───────────────────────────────
Route::get('/buat-admin-rahasia', function () {
    // 1. Hapus akun lama yang error (jika ada)
    User::where('email', 'admin@desa.id')->delete();
    
    // 2. Buat akun baru dengan enkripsi Bcrypt otomatis
    $user = new User();
    $user->name = 'Admin Desa';
    $user->email = 'admin@desa.id';
    $user->password = Hash::make('password');
    $user->save();
    
    return 'SUKSES! Akun Admin berhasil dibuat dengan enkripsi Bcrypt. Silakan kembali ke halaman Login.';
});
