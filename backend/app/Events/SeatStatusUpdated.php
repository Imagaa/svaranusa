<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Memastikan terkirim saat itu juga (Real-time tanpa delay queue)
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SeatStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $seats;

    /**
     * Create a new event instance.
     */
    public function __construct($seats)
    {
        $this->seats = $seats;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn()
    {
        // Harus sama persis dengan echo.channel('seats') di Frontend
        return new Channel('seats');
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs()
    {
        // Harus sama persis dengan .listen('.SeatStatusUpdated') di Frontend
        return 'SeatStatusUpdated';
    }
}