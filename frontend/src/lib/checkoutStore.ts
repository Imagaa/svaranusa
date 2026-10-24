import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerData {
  name: string;
  email: string;
  whatsapp: string;
}

interface CheckoutStore {
  customer: CustomerData | null;
  selectedSeats: string[]; // Menyimpan ID atau kode kursi
  donationAmount: number;
  setCustomer: (data: CustomerData) => void;
  setSelectedSeats: (seats: string[]) => void;
  setDonationAmount: (amount: number) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      customer: null,
      selectedSeats: [],
      donationAmount: 0,
      
      setCustomer: (data) => set({ customer: data }),
      setSelectedSeats: (seats) => set({ selectedSeats: seats }),
      setDonationAmount: (amount) => set({ donationAmount: amount }),
      
      // Dipanggil setelah pembayaran berhasil untuk membersihkan keranjang
      clearCheckout: () => set({ customer: null, selectedSeats: [], donationAmount: 0 }),
    }),
    {
      name: 'svaranusa-guest-checkout-v2', // Data akan otomatis tersimpan di localStorage browser
    }
  )
);