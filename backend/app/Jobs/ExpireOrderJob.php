<?php

namespace App\Jobs;

use App\Models\Order;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ExpireOrderJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $orderId) {}

    public function handle(): void
    {
        $order = Order::where('id', $this->orderId)
            ->where('status', 'pending')
            ->with('items.seat')
            ->first();

        // Jika order masih pending (belum dibayar), release semua seat
        if ($order) {
            OrderController::releaseOrder($order);
        }
    }
}
