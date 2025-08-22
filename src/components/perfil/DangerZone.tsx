'use client';

type DangerZoneProps = {
  className?: string;
  onDeleted?: () => void; // opcional: callback após apagar com sucesso
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
    <section
      className={[
        'bg-gradient-to-r from-red-950 via-red-700 to-red-950 text-red-50 rounded-sm p-2 border border-red-400/40 max-w-6xl mx-auto px-4 ',
        className,
      ].join(' ')}
    >
      <div className="flex items-center justify-between ">
        <div>
          <h3 className="text-sm font-semibold">Zona de Perigo</h3>
          <p className="text-xs opacity-90">Esta ação não pode ser desfeita.</p>
        </div>
        <button
          onClick={deleteAccount}
          className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold bg-red-700 hover:bg-red-400 transition border-red-300/30 px-3 py-2"
        >
          Apagar conta
        </button>
      </div>
    </section>
  );
}
