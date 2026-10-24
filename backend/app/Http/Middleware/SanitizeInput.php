<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    private array $except = ['password', 'password_confirmation'];

    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        $cleaned = $this->sanitize($input);
        $request->merge($cleaned);

        return $next($request);
    }

    private function sanitize(mixed $value): mixed
    {
        if (is_array($value)) {
            return array_map(fn($v) => $this->sanitize($v), $value);
        }

        if (is_string($value)) {
            // Hapus script tags
            $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
            // Hapus event attributes (onclick, onerror, dll)
            $value = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $value);
            // Hapus javascript: URLs
            $value = preg_replace('/javascript\s*:/i', '', $value);
            // Trim whitespace
            $value = trim($value);
        }

        return $value;
    }
}
