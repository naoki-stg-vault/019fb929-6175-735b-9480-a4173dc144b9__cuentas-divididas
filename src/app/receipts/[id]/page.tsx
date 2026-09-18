import { sampleReceipt } from '@/data/mock-receipt';
import { ReceiptDetailView } from '@/components/balance/ReceiptDetailView';
import Link from 'next/link';

interface ReceiptPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  // In production this would fetch from database; here we use the sample receipt or adapt the id
  const receipt = {
    ...sampleReceipt,
    id: id || sampleReceipt.id,
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-16 dark:bg-black">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400"
          >
            <span>←</span>
            <span>Inicio</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Comprobante compartido</span>
          </div>
        </div>
      </nav>

      <main>
        <ReceiptDetailView initialReceipt={receipt} />
      </main>
    </div>
  );
}
