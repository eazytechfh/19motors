import type { PipelineEtapa } from '@/types/database';

export const ETAPAS_PROTEGIDAS = new Set([
  'oportunidade',
  'em_qualificacao',
  'em_negociacao',
  'follow_up',
  'respondeu_follow_up',
  'resgate',
]);

export const ETAPAS_FALLBACK: PipelineEtapa[] = [
  ['oportunidade', 'Oportunidade', '#22c55e'],
  ['em_qualificacao', 'Em Qualificação', '#38bdf8'],
  ['em_negociacao', 'Em Negociação', '#f97316'],
  ['follow_up', 'Follow-up', '#a855f7'],
  ['respondeu_follow_up', 'Respondeu Follow Up', '#990bda'],
  ['fechado', 'Fechado', '#16a34a'],
  ['nao_fechou', 'Não Fechou', '#ef4444'],
  ['pesquisa_atendimento', 'Lembrete Interno', '#06b6d4'],
  ['resgate', 'Resgate', '#f6dd3c'],
].map(([slug, nome, cor], ordem) => ({
  id: -(ordem + 1),
  slug,
  nome,
  cor,
  ordem,
  is_inicial: ordem === 0,
  created_at: '',
  updated_at: '',
}));

export function etapaDe(slug: string | null | undefined, etapas: PipelineEtapa[]) {
  const key = (slug ?? '').trim().toLowerCase();
  return etapas.find((etapa) => etapa.slug === key) ?? {
    id: 0,
    slug: key,
    nome: key || 'Desconhecido',
    cor: '#6b7280',
    ordem: 999,
    is_inicial: false,
    created_at: '',
    updated_at: '',
  };
}

