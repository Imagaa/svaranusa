<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Donation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache; 
use OpenSpout\Writer\XLSX\Writer; 
use OpenSpout\Common\Entity\Row; 

class AdminController extends Controller
{
    public function summary()
    {
        $totalOrders    = Order::where('status', 'paid')->count();
        $grossRevenue   = Order::where('status', 'paid')->sum('paid_amount');
        $totalRevenue   = round($grossRevenue / 1.007);
        $totalTickets   = OrderItem::whereHas('order', fn($q) => $q->where('status', 'paid'))->count();
        
        $donationsTotal = Donation::where('status', 'paid')->sum('amount');
        $extraPaymentTotal = Order::where('status', 'paid')->get()->sum(fn($o) => max(0, $o->paid_amount - $o->total_price));
        $totalDonation = $donationsTotal + $extraPaymentTotal;

        try {
            $show1Tickets = OrderItem::whereHas('order', fn($q) => $q->where('status', 'paid'))->whereHas('seat.seatMap', fn($q) => $q->where('show_identifier', 'show1'))->count();
            $show2Tickets = OrderItem::whereHas('order', fn($q) => $q->where('status', 'paid'))->whereHas('seat.seatMap', fn($q) => $q->where('show_identifier', 'show2'))->count();
        } catch (\Exception $e) {
            $show1Tickets = 0; $show2Tickets = 0;
        }

        try {
            $totalSeats = \App\Models\Seat::count();
            $availableSeats = \App\Models\Seat::where('status', 'available')->count();
        } catch (\Exception $e) {
            $totalSeats = 0; $availableSeats = 0;
        }

        return response()->json([
            'summary' => [
                'total_orders'     => $totalOrders,
                'total_revenue'    => $totalRevenue,
                'total_tickets'    => $totalTickets,
                'show1_tickets'    => $show1Tickets,
                'show2_tickets'    => $show2Tickets,
                'total_seats'      => $totalSeats,
                'available_seats'  => $availableSeats,
                'total_donation'   => $totalDonation,
                'can_download_excel' => !Cache::has('last_excel_download')
            ]
        ]);
    }

    public function orders(Request $request)
    {
        $query = Order::where('status', 'paid')
            ->where('order_code', 'not like', 'VIP-%') // Membuang pesanan VIP dari sini
            ->with(['items.seat', 'items.seatCategory'])
            ->orderBy('created_at', 'desc');
            
        return response()->json($query->paginate(100));
    }

    public function donations()
    {
        // Menyisipkan kolom 'code' agar Frontend bisa mengirim request resend email
        $pureDonations = Donation::where('status', 'paid')->get()->map(function ($d) {
            return [
                'code'   => $d->donation_code,
                'name'   => $d->donor_name,
                'email'  => $d->donor_email,
                'amount' => $d->amount,
                'source' => 'Ruang Berbagi (Website)',
                'date'   => $d->paid_at ?? $d->updated_at,
            ];
        });

        $ticketDonations = Order::where('status', 'paid')->get()->filter(function ($o) {
            return $o->paid_amount > $o->total_price;
        })->map(function ($o) {
            return [
                'code'   => $o->order_code,
                'name'   => $o->buyer_name,
                'email'  => $o->buyer_email,
                'amount' => $o->paid_amount - $o->total_price,
                'source' => 'Pembelian Tiket',
                'date'   => $o->updated_at,
            ];
        });

        $allDonors = $pureDonations->merge($ticketDonations)->sortByDesc('date')->values();

        return response()->json(['data' => $allDonors]);
    }

    public function exportOrders()
    {
        if (Cache::has('last_excel_download')) {
            return response()->json(['message' => 'Limit tercapai. Fitur download hanya bisa digunakan 1x setiap 12 Jam.'], 429);
        }

        $orders = Order::where('status', 'paid')
            ->with(['items.seat.seatMap', 'items.seatCategory'])
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = "Data_Pembeli_Svaranusa_" . date('Y-m-d_H-i') . ".xlsx";
        Cache::put('last_excel_download', true, now()->addHours(12));

        $writer = new Writer();
        $writer->openToBrowser($filename);

        $writer->addRow(Row::fromValues([
            'KODE ORDER', 'NAMA PEMBELI', 'EMAIL', 'NO WA', 
            'TOTAL TIKET', 'SHOW / JADWAL', 'DAFTAR KURSI', 
            'HARGA MURNI (TANPA ADMIN)', 'DONASI EXTRA', 'TANGGAL BELI'
        ]));

        foreach ($orders as $order) {
            $hargaTiketMurni = $order->items->sum('price');
            $donasiExtra = max(0, $order->paid_amount - $order->total_price);
            $kursi = $order->items->map(fn($i) => $i->seat ? $i->seat->code : '?')->implode(', ');
            
            $show = 'Tidak Diketahui';
            if ($order->items->first() && $order->items->first()->seat && $order->items->first()->seat->seatMap) {
                $show = $order->items->first()->seat->seatMap->show_identifier;
            }

            $writer->addRow(Row::fromValues([
                $order->order_code,
                $order->buyer_name,
                $order->buyer_email,
                $order->buyer_phone,
                $order->items->count(),
                strtoupper($show),
                $kursi,
                $hargaTiketMurni,
                $donasiExtra,
                $order->created_at->format('Y-m-d H:i:s')
            ]));
        }

        $writer->close();
        exit;
    }

    public function resendTicket(Request $request, $orderCode)
    {
        $order = Order::where('order_code', $orderCode)->where('status', 'paid')->firstOrFail();
        if ($request->has('new_email') && filter_var($request->new_email, FILTER_VALIDATE_EMAIL)) {
            $order->update(['buyer_email' => $request->new_email]);
        }
        \Illuminate\Support\Facades\Mail::to($order->buyer_email)->send(new \App\Mail\EticketMail($order));
        return response()->json(['message' => 'Berhasil mengirim ulang tiket ke ' . $order->buyer_email]);
    }

    // --- FITUR BARU: KIRIM ULANG EMAIL DONASI ---
    public function resendDonationEmail($code)
    {
        $donation = Donation::where('donation_code', $code)->where('status', 'paid')->firstOrFail();
        \Illuminate\Support\Facades\Mail::to($donation->donor_email)->send(new \App\Mail\DonationMail($donation));
        
        return response()->json(['message' => 'Email ucapan terima kasih berhasil dikirim ke ' . $donation->donor_email]);
    }

    // --- FITUR BARU: TOGGLE STATUS PENDAFTARAN (KILL-SWITCH) ---
    public function toggleShowStatus(Request $request, $show)
    {
        $seatMap = \App\Models\SeatMap::where('show_identifier', $show)->latest()->firstOrFail();
        $seatMap->is_active = !$seatMap->is_active;
        $seatMap->save();

        return response()->json([
            'message' => 'Status pendaftaran berhasil diubah.',
            'is_active' => $seatMap->is_active
        ]);
    }

    // --- FITUR BARU: PLOTTING VIP (JALUR BELAKANG) ---
    public function storeVipReservation(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'show' => 'required|string',
            'seats' => 'required|array|min:1',
            'seats.*' => 'required|string',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $seatMap = \App\Models\SeatMap::where('show_identifier', $request->show)->latest()->firstOrFail();

        // Syarat mutlak: Admin hanya bisa mem-plot jika jalur publik ditutup
        if ($seatMap->is_active) {
            return response()->json(['message' => 'Tutup pendaftaran publik terlebih dahulu sebelum melakukan plot VIP.'], 403);
        }

        try {
            DB::beginTransaction();

            $seats = \App\Models\Seat::where('seat_map_id', $seatMap->id)
                ->whereIn('code', $request->seats)
                ->lockForUpdate()
                ->get();

            if ($seats->count() !== count($request->seats)) {
                throw new \Exception('Beberapa kode kursi tidak ditemukan di denah ini.');
            }

            foreach ($seats as $seat) {
                if ($seat->status !== 'available') {
                    throw new \Exception("Kursi {$seat->code} sudah tidak tersedia.");
                }
            }

            $orderCode = 'VIP-' . strtoupper(\Illuminate\Support\Str::random(10));

            $order = Order::forceCreate([
                'order_code' => $orderCode,
                'buyer_name' => $request->customer_name,
                'buyer_email' => $request->customer_email,
                'buyer_phone' => $request->customer_phone,
                'total_price' => 0,
                'paid_amount' => 0,
                'status' => 'paid',
                'expires_at' => now(),
            ]);

            foreach ($seats as $seat) {
                $seat->update(['status' => 'sold']);
                \App\Models\OrderItem::forceCreate([
                    'order_id' => $order->id,
                    'seat_id' => $seat->id,
                    'seat_category_id' => $seat->seat_category_id,
                    'price' => 0,
                    'ticket_code' => 'TKT-' . strtoupper(\Illuminate\Support\Str::random(10)),
                ]);
            }

            // --- TRIGGER ANTRIAN EMAIL ASINKRON ---
            \Illuminate\Support\Facades\Mail::to($order->buyer_email)
                ->queue(new \App\Mail\EticketMail($order));

            DB::commit();

            // Broadcast WebSockets agar layar UI admin/publik realtime berubah
            $broadcastPayload = array_map(
                fn($code) => ['seat_code' => $code, 'status' => 'sold'],
                $request->seats
            );
            try { broadcast(new \App\Events\SeatStatusUpdated($broadcastPayload)); } catch (\Exception $e) {}

            return response()->json([
                'message' => 'Reservasi VIP berhasil dibuat dan E-Ticket sedang dikirim.',
                'order_code' => $orderCode
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
    
    // --- FITUR BARU: MENGAMBIL DAFTAR VIP SAJA ---
    public function getVipOrders(Request $request)
    {
        $query = Order::where('status', 'paid')
            ->where('order_code', 'like', 'VIP-%')
            ->with(['items.seat.seatMap']) // Load relasi map agar tahu Show 1/Show 2
            ->orderBy('created_at', 'desc');
            
        return response()->json($query->paginate(100));
    }

    // --- FITUR BARU: CABUT (REVOKE) TIKET VIP ---
    public function revokeVipOrder($orderCode)
    {
        try {
            DB::beginTransaction();

            $order = Order::where('order_code', $orderCode)
                ->where('order_code', 'like', 'VIP-%')
                ->with('items.seat')
                ->firstOrFail();

            $releasedSeats = [];

            foreach ($order->items as $item) {
                if ($item->seat) {
                    // Kembalikan status kursi menjadi hijau (available)
                    $item->seat->update(['status' => 'available']);
                    $releasedSeats[] = $item->seat->code;
                }
                $item->delete(); // Hapus item
            }

            $order->delete(); // Hapus pesanan utamanya

            DB::commit();

            // Tembakkan WebSockets agar layar denah Admin & Publik langsung update
            if (!empty($releasedSeats)) {
                $broadcastPayload = array_map(
                    fn($code) => ['seat_code' => $code, 'status' => 'available'], 
                    $releasedSeats
                );
                try { broadcast(new \App\Events\SeatStatusUpdated($broadcastPayload)); } catch (\Exception $e) {}
            }

            return response()->json(['message' => 'Pesanan VIP berhasil dicabut. Kursi kembali kosong.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Terjadi kesalahan sistem saat mencabut VIP.'], 500);
        }
    }
}