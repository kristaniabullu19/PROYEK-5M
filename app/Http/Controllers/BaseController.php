<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class BaseController extends BaseController
{
    protected function successResponse($data = null, $message = 'Success', $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    protected function errorResponse($message = 'Error', $code = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $code);
    }
}
