<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SuratController;
use App\Http\Controllers\Api\StatsController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC ROUTES (tidak perlu token) ─────────────────────────
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/check-desa',[AuthController::class, 'checkDesa']);

// ── PROTECTED ROUTES (wajib Sanctum token) ────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Surat — endpoint terpisah masuk & keluar
    Route::get('/surat',              [SuratController::class, 'index']);
    Route::post('/surat',             [SuratController::class, 'store']);        // legacy compat
    Route::post('/surat/masuk',       [SuratController::class, 'storeSuratMasuk']);
    Route::post('/surat/keluar',      [SuratController::class, 'storeSuratKeluar']);
    Route::get('/surat/{id}',         [SuratController::class, 'show']);
    Route::delete('/surat/{id}',      [SuratController::class, 'destroy']);

    // Ekstra
    Route::get('/stats',              [StatsController::class, 'index']);
    Route::get('/nomor-preview',      [SuratController::class, 'nomorPreview']);
});
