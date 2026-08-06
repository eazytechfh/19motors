import clsx from 'clsx';

export interface StatusConfig {
  label: string;
  color: string; // hex
}

// Mapa central de estágio -> { label, color }. Mantido aqui para ser reaproveitado por
// Pipeline, Leads e Dashboard, garantindo cores consistentes em toda a aplicação.
//
// Este mapa é o fallback visual. A fonte de verdade do Pipeline é `pipeline_etapas`; valores
// adicionais continuam recebendo o fallback cinza nas telas que usam apenas este componente.
export const ESTAGIO_CONFIG: Record<string, StatusConfig> = {
  oportunidade: { label: 'Oportunidade', color: '#22c55e' },
  em_qualificacao: { label: 'Em Qualificação', color: '#38bdf8' },
  em_negociacao: { label: 'Em Negociação', color: '#f97316' },
  follow_up: { label: 'Follow-up', color: '#a855f7' },
  respondeu_follow_up: { label: 'Respondeu Follow Up', color: '#990bda' },
  fechado: { label: 'Fechado', color: '#16a34a' },
  nao_fechou: { label: 'Não Fechou', color: '#ef4444' },
  pesquisa_atendimento: { label: 'Lembrete Interno', color: '#06b6d4' },
  resgate: { label: 'Resgate', color: '#f6dd3c' },
};

const DEFAULT_CONFIG: StatusConfig = { label: 'Desconhecido', color: '#6b7280' };

interface StatusBadgeProps {
  estagio: string | null | undefined;
  className?: string;
}

export function StatusBadge({ estagio, className }: StatusBadgeProps) {
  const key = (estagio ?? '').toLowerCase().trim();
  const config = ESTAGIO_CONFIG[key] ?? DEFAULT_CONFIG;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        className
      )}
      style={{ backgroundColor: `${config.color}1a`, color: config.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
