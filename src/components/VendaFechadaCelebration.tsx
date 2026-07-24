'use client';

import { useEffect } from 'react';

interface VendaFechadaCelebrationProps {
  nomeLead: string;
  onFinish: () => void;
}

export function VendaFechadaCelebration({
  nomeLead,
  onFinish,
}: VendaFechadaCelebrationProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onFinish, 5000);
    return () => window.clearTimeout(timeout);
  }, [onFinish]);

  return (
    <div
      className="sale-celebration fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-slate-950/90 p-6 backdrop-blur-sm motion-reduce:transition-none"
      role="status"
      aria-live="assertive"
      onClick={onFinish}
    >
      <div className="sale-speed-lines" aria-hidden="true" />
      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <span className="sale-kicker">NEGÓCIO CONCLUÍDO</span>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
          Parabéns pela venda!
        </h2>
        <p className="mt-2 text-base text-slate-300">
          {nomeLead} avançou para a linha de chegada.
        </p>

        <div className="sale-car-stage mt-8" aria-hidden="true">
          <div className="sale-car-glow" />
          {/* Asset derivado da referência enviada pelo usuário, sem logotipos ou texto. */}
          <img
            className="sale-car"
            src="/effects/sale-car-neon.png"
            alt=""
            width={1536}
            height={1024}
          />
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
          Clique para continuar
        </p>
      </div>
    </div>
  );
}
