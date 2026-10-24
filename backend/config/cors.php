<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie','broadcasting/auth'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'https://sandhyakalacitrabudaya.com',       
        'https://www.sandhyakalacitrabudaya.com',   //Domain utama
        'https://admin.sandhyakalacitrabudaya.com', // Domain Admin
        'https://svaranusa-frontend.vercel.app'     // Domain cadangan Vercel
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, 
];