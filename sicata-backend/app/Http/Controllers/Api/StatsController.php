<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SuratService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function __construct(private readonly SuratService $suratService) {}

    public function index(Request $request): JsonResponse
    {
        $desa  = $request->user()->desa;
        $stats = $this->suratService->getStats($desa);
        return response()->json($stats);
    }
}
