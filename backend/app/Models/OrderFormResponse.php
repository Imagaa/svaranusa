<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderFormResponse extends Model
{
    protected $fillable = ['order_id', 'form_schema_id', 'responses'];

    protected $casts = [
        'responses' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function formSchema()
    {
        return $this->belongsTo(FormSchema::class);
    }
}
