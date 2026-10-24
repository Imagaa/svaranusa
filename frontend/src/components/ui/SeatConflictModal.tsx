'use client';

type Step = 'conflict' | 'confirm';

interface Props {
  step: Step;
  conflict: string[];
  available: string[];
  onContinue: () => void;
  onCancel: () => void;
}

export default function SeatConflictModal({
  step, conflict, available, onContinue, onCancel
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-svara-black border border-svara-white/20 w-full sm:max-w-md mx-0 sm:mx-4 p-6">

        {step === 'conflict' ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="font-display text-xl text-svara-white">Kursi Tidak Tersedia</h2>
            </div>

            <p className="text-svara-white/60 text-sm mb-4">
              Kursi berikut baru saja dibeli orang lain:
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {conflict.map(s => (
                <span key={s}
                  className="text-red-300 text-xs font-mono bg-red-900/30 border border-red-500/30 px-2.5 py-1 rounded">
                  {s}
                </span>
              ))}
            </div>

            {available.length > 0 ? (
              <>
                <p className="text-svara-white/60 text-sm mb-3">
                  Kursi yang masih tersedia dari pesananmu:
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {available.map(s => (
                    <span key={s}
                      className="text-svara-green text-xs font-mono bg-svara-green/10 border border-svara-green/30 px-2.5 py-1 rounded">
                      ✓ {s}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={onCancel}
                    className="flex-1 border border-svara-white/20 text-svara-white py-3 text-sm tracking-widest uppercase hover:border-svara-white/50 transition-colors">
                    Pilih Ulang
                  </button>
                  <button onClick={onContinue}
                    className="flex-1 bg-svara-orange text-svara-black py-3 font-semibold tracking-widest uppercase text-sm hover:bg-svara-orange/90 transition-colors">
                    Lanjut Tanpa {conflict.length} Kursi →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-svara-white/40 text-sm mb-6">
                  Semua kursi pilihanmu sudah tidak tersedia. Silakan pilih kursi lain.
                </p>
                <button onClick={onCancel}
                  className="w-full bg-svara-green text-svara-black py-3 font-semibold tracking-widest uppercase text-sm">
                  Pilih Kursi Lain
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✅</span>
              <h2 className="font-display text-xl text-svara-white">Konfirmasi Pembelian</h2>
            </div>

            <p className="text-svara-white/60 text-sm mb-3">
              Kamu akan membeli{' '}
              <span className="text-svara-white font-semibold">{available.length} tiket</span>:
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {available.map(s => (
                <span key={s}
                  className="text-svara-green text-xs font-mono bg-svara-green/10 border border-svara-green/30 px-2.5 py-1 rounded">
                  {s}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={onCancel}
                className="flex-1 border border-svara-white/20 text-svara-white py-3 text-sm tracking-widest uppercase hover:border-svara-white/50 transition-colors">
                Batal
              </button>
              <button onClick={onContinue}
                className="flex-1 bg-svara-green text-svara-black py-3 font-semibold tracking-widest uppercase text-sm hover:bg-svara-green/90 transition-colors">
                Ya, Lanjutkan →
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}