<!DOCTYPE html>
<html>
<head>
    <title>Terima Kasih - Svaranusa</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="background: linear-gradient(to right, #bee94e, #a7cd45); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #bee94e; letter-spacing: 2px;">SVARANUSA</h1>
    </div>
    <p>Halo, <strong>{{ $donation->donor_name }}</strong>!</p>
    <p>Kami mengucapkan terima kasih yang sebesar-besarnya atas kebaikan dan partisipasi Anda melalui program Ruang Berbagi.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase;">Total Donasi Diterima</p>
        <h2 style="margin: 5px 0 0 0; color: #16a34a;">Rp {{ number_format($donation->amount, 0, ',', '.') }}</h2>
    </div>

    <p>Dukungan Anda sangat berarti bagi kelancaran dan kesuksesan acara kami. Semoga kebaikan Anda membawa berkah yang berlipat ganda.</p>
    <br>
    <p>Salam hangat,<br><strong>Tim Svaranusa</strong></p>
</body>
</html>