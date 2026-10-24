<?php

namespace App\Mail;

use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

// Class ini menggunakan "ShouldQueue" agar dikerjakan oleh Worker di Railway
class EticketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'E-Ticket Resmi Svaranusa - ' . $this->order->order_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'email.eticket', 
        );
    }

    public function attachments(): array
    {
        // Generate PDF secara on-the-fly di latar belakang
        $pdf = Pdf::loadView('pdf.eticket', ['order' => $this->order]);
        $pdf->setPaper('a4', 'portrait');

        return [
            // Lampirkan PDF ke dalam email
            Attachment::fromData(fn () => $pdf->output(), "SVARANUSA-TICKET-{$this->order->order_code}.pdf")
                    ->withMime('application/pdf'),
        ];
    }
}