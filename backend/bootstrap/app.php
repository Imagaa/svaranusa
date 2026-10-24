<?php

use App\Http\Middleware\SanitizeInput;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Sanitasi semua input API
        $middleware->appendToGroup('api', SanitizeInput::class);

        // Rate limiting
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // JSON response untuk semua error di API
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return response()->json([
                        'message' => 'Validasi gagal',
                        'errors' => $e->errors(),
                    ], 422);
                }

                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return response()->json(['message' => 'Data tidak ditemukan'], 404);
                }

                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return response()->json(['message' => 'Unauthorized'], 401);
                }
            }
        });
    })->create();
