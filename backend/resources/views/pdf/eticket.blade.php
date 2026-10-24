<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>E-Ticket Svaranusa</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .page-break {
            page-break-after: always;
        }
        .ticket-container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            border: 2px solid #000;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 30px;
        }
        .ticket-header {
            background-color: #000000;
            color: #ea580c; /* Svara Orange */
            padding: 20px;
            text-align: center;
        }
        .ticket-header h1 {
            margin: 0;
            font-size: 32px;
            letter-spacing: 5px;
        }
        .ticket-header p {
            color: #ffffff;
            margin: 5px 0 0 0;
            font-size: 14px;
            letter-spacing: 2px;
        }
        .ticket-body {
            padding: 30px;
            position: relative;
        }
        .info-row {
            margin-bottom: 20px;
        }
        .info-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-top: 5px;
        }
        .seat-highlight {
            background-color: #ea580c;
            color: white;
            padding: 5px 15px;
            border-radius: 5px;
            font-size: 24px;
            display: inline-block;
            vertical-align: middle;
        }
        .qr-section {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px dashed #ccc;
        }
        .qr-code {
            margin: 0 auto;
        }
        .instructions {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px dashed #ccc;
            font-size: 12px;
            color: #333;
            line-height: 1.6;
        }
        .instructions strong {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            color: #000;
        }
        .instructions ol {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin-bottom: 5px;
        }
        .ticket-footer {
            background-color: #f4f4f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>

    @foreach($order->items as $index => $item)
        @php
            // Mendeteksi data show dari seat map
            $showId = $item->seat->seatMap->show_identifier ?? 'show1';
            $showName = $showId === 'show1' ? 'Show 1 (18.00 WIB)' : 'Show 2 (20.00 WIB)';
        @endphp
        <div class="ticket-container">
            <div class="ticket-header">
                <h1>SVARANUSA</h1>
                <p>PANGGUNG UTAMA GAMELAN</p>
            </div>
            
            <div class="ticket-body">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 50%; vertical-align: top;">
                            <div class="info-row">
                                <div class="info-label">Nama Pemesan</div>
                                <div class="info-value">{{ strtoupper($order->buyer_name) }}</div>
                            </div>
                            <div class="info-row">
                                <div class="info-label">Kode Pesanan</div>
                                <div class="info-value">{{ $order->order_code }}</div>
                            </div>
                            <div class="info-row">
                                <div class="info-label">Kategori Zona</div>
                                <div class="info-value">{{ strtoupper($item->seat->seatCategory->name) }}</div>
                            </div>
                        </td>
                        <td style="width: 50%; text-align: right; vertical-align: top;">
                            <div class="info-row">
                                <div class="info-label">Tiket Ke-</div>
                                <div class="info-value" style="color: #ea580c;">
                                    {{ $loop->iteration }} / {{ $order->items->count() }}
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="info-label">Sesi & Nomor Kursi</div>
                                <div class="info-value">
                                    <span style="font-size: 14px; color: #ea580c; vertical-align: middle; margin-right: 8px;">{{ $showName }}</span>
                                    <span class="seat-highlight">{{ $item->seat->code }}</span>
                                </div>
                            </div>
                            <div class="info-row" style="margin-top: 15px;">
                                <div class="info-label">Kode Tiket Validasi</div>
                                <div class="info-value" style="font-family: monospace; font-size: 15px;">{{ $item->ticket_code }}</div>
                            </div>
                        </td>
                    </tr>
                </table>

                <div class="qr-section">
                    <p class="info-label" style="margin-bottom: 10px;">Pindai saat memasuki venue</p>
                    <div class="qr-code">
                        <img src="data:image/svg+xml;base64, {!! base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->margin(1)->size(180)->generate($item->ticket_code)) !!} ">
                    </div>
                </div>

                <div class="instructions">
                    <strong>Cara Penggunaan Tiket:</strong>
                    <ol>
                        <li>Tunjukkan halaman ini kepada petugas di gate masuk atau <em>screenshot</em> e-ticket sebagai cadangan jika sinyal internet sulit ketika hari-H.</li>
                        <li>Petugas akan men-<em>scan</em> QR code tiket kamu.</li>
                        <li>Satu QR code hanya berlaku untuk satu kali <em>check-in</em> per kursi.</li>
                    </ol>
                </div>
            </div>

            <div class="ticket-footer">
                Tiket ini adalah bukti pembelian yang sah. Harap tidak membagikan QR Code kepada orang lain.<br>
                Dicetak pada: {{ now()->format('d M Y H:i') }} WIB
            </div>
        </div>

        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach

</body>
</html>