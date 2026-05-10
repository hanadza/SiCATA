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

    /**
     * POST /api/change-password
     * Ganti password — validasi password lama, lalu set baru.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::min(8)],
        ], [
            'current_password.required' => 'Password lama wajib diisi.',
            'password.required'         => 'Password baru wajib diisi.',
            'password.confirmed'        => 'Konfirmasi password tidak sama.',
            'password.min'              => 'Password baru minimal 8 karakter.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password lama tidak sesuai.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    /**
     * PUT /api/profile
     * Update profil user (nama, email, telp, desa).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'telp'  => ['nullable', 'string', 'max:20'],
            'desa'  => ['sometimes', 'string', 'max:100', 'unique:users,desa,' . $user->id],
        ], [
            'email.unique' => 'Email sudah digunakan akun lain.',
            'desa.unique'  => 'Desa sudah terdaftar di akun lain.',
        ]);

        if ($request->has('name'))  $user->name  = $request->name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('telp'))  $user->telp  = $request->telp;
        if ($request->has('desa'))  $user->desa  = $request->desa;

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $this->userArray($user),
        ]);
    }

    /**
     * GET /api/users
     * Daftar semua user (admin only).
     */
    public function listUsers(Request $request): JsonResponse
    {
        // Hanya admin yang boleh melihat daftar user
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'desa', 'telp', 'jabatan')
            ->orderBy('id')
            ->get()
            ->map(fn ($u) => $this->userArray($u));

        return response()->json(['data' => $users]);
    }

    /**
     * DELETE /api/users/{id}
     * Hapus user (admin only, tidak bisa hapus diri sendiri).
     */
    public function deleteUser(int $id, Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        if ($request->user()->id === $id) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Akun berhasil dihapus.']);
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
