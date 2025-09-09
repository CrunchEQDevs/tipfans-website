'use client';

type DangerZoneProps = {
  className?: string;
  onDeleted?: () => void; // callback opcional após apagar
};

export default function DangerZone({ className = '', onDeleted }: DangerZoneProps) {
  async function deleteAccount() {
    if (!confirm('Tem a certeza que deseja apagar a conta? Esta ação é irreversível.')) return;

    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao apagar conta.');
      alert('Conta apagada.');
      onDeleted?.();
    } catch {
      alert('Erro ao apagar conta.');
    }
  }

  return (
    <section className={`max-w-5xl mx-auto px-4 md:px-6 ${className}`}>
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900 via-red-700 to-red-900 p-6 text-red-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Zona de Perigo</h3>
            <p className="text-xs opacity-90">Esta ação não pode ser desfeita.</p>
          </div>
          <button
            onClick={deleteAccount}
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-500 transition px-4 py-2 border border-red-400/40"
          >
            Apagar conta
          </button>
        </div>
      </div>
    </section>
  );
}
