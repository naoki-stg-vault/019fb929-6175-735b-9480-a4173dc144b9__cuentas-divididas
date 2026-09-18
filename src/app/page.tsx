import { ReceiptDetailView } from '@/components/balance/ReceiptDetailView';
import { sampleReceipt } from '@/data/mock-receipt';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-16 dark:bg-black">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base font-bold text-white shadow-xs">
              ⚖️
            </span>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Cuentas Divididas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Cálculo de saldos activo
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <ReceiptDetailView initialReceipt={sampleReceipt} />
      </main>
    </div>
  );
}
