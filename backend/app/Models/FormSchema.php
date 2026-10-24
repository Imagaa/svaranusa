<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormSchema extends Model
{
    protected $fillable = ['title', 'fields', 'is_active'];

    protected $casts = [
        'fields' => 'array',
        'is_active' => 'boolean',
    ];

    public function responses()
    {
        return $this->hasMany(OrderFormResponse::class);
    }
}
