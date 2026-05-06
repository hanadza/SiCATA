<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * POST /api/login
     * Support login via email atau username. Satu desa = satu akun.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Support login dengan email atau name/username
        $user = User::where('email', $request->email)
            ->orWhere('name', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email/username atau password salah.'],
            ]);
        }

        // Hapus token lama agar tidak menumpuk
        $user->tokens()->where('name', 'sicata-app')->delete();

        $token = $user->createToken('sicata-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userArray($user),
        ]);
    }

    /**
     * POST /api/register
     * Registrasi akun desa baru.
     * Aturan: satu desa hanya boleh satu akun (desa bersifat unique).
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'email', 'unique:users,email'],
            'password'              => ['required', 'confirmed', Password::min(8)],
            'telp'                  => ['nullable', 'string', 'max:20'],
            'desa'                  => ['required', 'string', 'max:100', 'unique:users,desa'],
        ], [
            'desa.unique'   => 'Desa ini sudah memiliki akun. Setiap desa hanya boleh mendaftar satu kali.',
            'email.unique'  => 'Email sudah terdaftar, gunakan email lain.',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'telp'     => $request->telp,
            'desa'     => $request->desa,
            'jabatan'  => 'Kepala Desa',
            'role'     => 'user',
        ]);

        $token = $user->createToken('sicata-app')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->userArray($user),
        ], 201);
    }

    /**
     * GET /api/check-desa?desa=...
     * Cek apakah nama desa sudah terdaftar (untuk validasi realtime di form registrasi).
     */
    public function checkDesa(Request $request): JsonResponse
    {
        $desa     = $request->query('desa', '');
        $tersedia = !User::where('desa', $desa)->exists();

        return response()->json(['tersedia' => $tersedia]);
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil.']);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json($this->userArray($request->user()));
    }

    // ── Helper ────────────────────────────────────────────────
    private function userArray(User $user): array
    {
        return [
            'id'      => $user->id,
            'nama'    => $user->name,
            'email'   => $user->email,
            'role'    => $user->role,
            'desa'    => $user->desa,
            'telp'    => $user->telp,
            'jabatan' => $user->jabatan,
        ];
    }
}
