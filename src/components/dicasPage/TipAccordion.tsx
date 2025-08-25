// src/components/dicasPage/TipAccordion.tsx
import type { TipCard } from "@/components/dicasPage/types";
import type { ReactNode } from "react";

// Acordeão em 2 níveis. Use open1/open2 para estado inicial.
export default function TipAccordion({
  tip,
  open1 = false,
  open2 = false,
}: {
  tip: TipCard;
  open1?: boolean;
  open2?: boolean;
}) {
  const d = new Date(tip.dateISO);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const day = d.toLocaleDateString();

  return (
    <details
      className="group rounded-md border border-neutral-800 bg-neutral-900/60 overflow-hidden"
      open={open1}
    >
      {/* Nível 1 (fechado): escudos + VS + caret */}
      <summary className="list-none cursor-pointer">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-5 rounded bg-neutral-700" />
            <span className="text-sm font-semibold text-neutral-200">{tip.home}</span>
            <span className="px-2 text-xs opacity-70">VS</span>
            <span className="inline-block h-5 w-5 rounded bg-neutral-700" />
            <span className="text-sm font-semibold text-neutral-200">{tip.away}</span>
          </div>
          <span className="h-6 w-6 grid place-items-center rounded bg-neutral-800 text-neutral-300">
            ▾
          </span>
        </div>
      </summary>

      {/* Conteúdo do nível 1 */}
      <div className="border-t border-neutral-800 p-2 md:p-3">
        {/* Nível 2: header + '+' laranja */}
        <details
          className="group rounded-md border border-neutral-800 bg-neutral-900/60 overflow-hidden"
          open={open2}
        >
          <summary className="list-none cursor-pointer">
            <div className="flex items-start justify-between px-3 py-3 gap-4">
              {/* Esquerda: data (↑) / hora (↓) */}
              <div className="flex flex-col gap-1 text-[11px] text-neutral-400">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded bg-neutral-700" />
                  <span>{day}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-3 w-3 items-center justify-center" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                    </svg>
                  </span>
                  <time dateTime={`${d.toISOString().slice(0, 16)}`}>{hh}:{mm}</time>
                </div>
              </div>

              {/* Direita: "Nossa previsão" (↑) / valor (↓) + '+' laranja */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-end text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3.5 w-3.5 rounded-full bg-emerald-500" />
                    <span className="text-neutral-300">Nossa previsão</span>
                  </div>
                  {tip.pick && (
                    <span className="mt-1 text-emerald-400 font-semibold text-right">
                      {tip.pick}
                    </span>
                  )}
                </div>

                {/* + sempre laranja (não vira X) */}
                <span className="h-7 w-7 grid place-items-center rounded bg-neutral-800 text-orange-500 font-bold">
                  +
                </span>
              </div>
            </div>
          </summary>

          {/* Detalhes do nível 2 (como no mock) */}
          <div className="border-t border-neutral-800 px-3 py-3">
            <InfoRow
              icon={<span className="text-orange-400">🔥</span>}
              label="Dica quente"
              value={tip.pick ?? "-"}
              note={tip.hotTip}
              strongValue
            />

            {tip.correctScore && (
              <InfoRow
                icon={<span className="text-neutral-300">⚽</span>}
                label="Pontuação correta"
                value={tip.correctScore}
              />
            )}

            {typeof tip.bothTeamsScore !== "undefined" && (
              <InfoRow
                icon={<span className="text-orange-400">✶</span>}
                label="Ambas as equipas ganham"
                value={tip.bothTeamsScore}
                last
              />
            )}

            {tip.ctaUrl && (
              <div className="pt-3 flex justify-center">
                <a
                  href={tip.ctaUrl}
                  className="inline-flex items-center gap-2 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2 transition"
                >
                  Ler a previsão completa do {tip.home} vs {tip.away}
                  <span className="text-base leading-none">›</span>
                </a>
              </div>
            )}
          </div>
        </details>
      </div>
    </details>
  );
}

// Linha de informação (label à esquerda; valor à direita; nota embaixo)
function InfoRow({
  icon,
  label,
  value,
  note,
  strongValue,
  last,
}: {
  icon: ReactNode;
  label: string;
  value: string | number | "YES" | "NO";
  note?: string;
  strongValue?: boolean;
  last?: boolean;
}) {
  return (
    <div className={["py-2.5", last ? "" : "border-b border-neutral-700"].join(" ")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-neutral-200">
          <span className="grid place-items-center h-4 w-4">{icon}</span>
          <span className="font-semibold">{label}</span>
        </div>
        <div
          className={[
            "text-[12px] md:text-xs text-right",
            strongValue ? "font-semibold text-neutral-100" : "text-neutral-300",
          ].join(" ")}
        >
          {String(value)}
        </div>
      </div>

      {note && <p className="mt-2 text-[11px] leading-snug text-neutral-400">{note}</p>}
    </div>
  );
}
