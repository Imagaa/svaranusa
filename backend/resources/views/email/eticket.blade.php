<!DOCTYPE html>
<html>
<head>
    <title>E-Ticket Svaranusa Anda</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ea580c; text-align: center;">Terima kasih atas pembelian Anda!</h2>
        
        <p>Halo, <strong>{{ $order->buyer_name }}</strong>,</p>
        <p>Pembayaran untuk tiket Svaranusa (Kode Pesanan: <strong>{{ $order->order_code }}</strong>) telah kami terima dengan sukses.</p>
        
        <p>Bersama email ini, kami melampirkan file PDF E-Ticket resmi Anda. Mohon unduh dan simpan file tersebut. Anda dapat menunjukkannya kepada petugas di pintu masuk venue nanti.</p>

        <p><strong>Catatan Penting:</strong></p>
        <ul style="font-size: 14px; color: #555;">
            <li>Satu QR Code hanya berlaku untuk 1 (satu) kali scan masuk.</li>
            <li>Harap jangan membagikan gambar QR Code Anda di media sosial untuk mencegah pencurian tiket.</li>
        </ul>

        <br>
        <p>Sampai jumpa di Panggung Utama Gamelan Svaranusa!</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">Email ini dibuat otomatis oleh sistem. Harap tidak membalas email ini.</p>
    </div>
</body>
</html>