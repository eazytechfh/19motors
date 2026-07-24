'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { tocarSomLeadAtribuido } from '@/lib/feedback/transferencia';

interface LeadAssignmentSoundWatcherProps {
  vendedor: string;
}

const INTERVALO_CONFIRMACAO_MS = 15_000;

export function LeadAssignmentSoundWatcher({ vendedor }: LeadAssignmentSoundWatcherProps) {
  const idsAtribuidos = useRef<Set<number>>(new Set());
  const inicializado = useRef(false);

  useEffect(() => {
    if (!vendedor.trim()) return;
    const supabase = createClient();
    let ativo = true;

    async function verificarAtribuicoes(tocarNovas: boolean) {
      const { data, error } = await supabase
        .from('BASE_DE_LEADS')
        .select('id')
        .eq('vendedor', vendedor);
      if (!ativo || error) return;

      const atuais = new Set(((data as { id: number }[]) ?? []).map((lead) => lead.id));
      const recebeuNovo =
        inicializado.current &&
        Array.from(atuais).some((id) => !idsAtribuidos.current.has(id));

      idsAtribuidos.current = atuais;
      inicializado.current = true;
      if (tocarNovas && recebeuNovo) await tocarSomLeadAtribuido();
    }

    void verificarAtribuicoes(false);

    const canal = supabase
      .channel(`lead-assignment-${vendedor}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'BASE_DE_LEADS' },
        () => void verificarAtribuicoes(true)
      )
      .subscribe();

    // Polling leve cobre automações/ambientes onde a tabela ainda não está na publication realtime.
    const intervalo = window.setInterval(
      () => void verificarAtribuicoes(true),
      INTERVALO_CONFIRMACAO_MS
    );

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      void supabase.removeChannel(canal);
    };
  }, [vendedor]);

  return null;
}
