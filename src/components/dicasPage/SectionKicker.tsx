// Server Component
export default function SectionKicker({ whenLabel }: { whenLabel: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-orange-500 text-xl">✔︎</span>
        <span className="text-neutral-200">Top previsões para {whenLabel}</span>
      </div>
    </div>
  );
}
