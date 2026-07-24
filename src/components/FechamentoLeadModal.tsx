'use client';

import { useState } from 'react';
import { validarDadosParaFechamento } from '@/lib/leads/fechamento';

interface FechamentoLeadModalProps {
  nomeInicial: string;
  valorInicial: number | null;
  salvando: boolean;
  erroServidor: string | null;
  onCancel: () => void;
  onConfirm: (dados: { nome_lead: string; valor: number }) => void;
}

export function FechamentoLeadModal({
  nomeInicial,
  valorInicial,
  salvando,
  erroServidor,
  onCancel,
  onConfirm,
}: FechamentoLeadModalProps) {
  const [nome, setNome] = useState(nomeInicial);
  const [valor, setValor] = useState(valorInicial ? String(valorInicial) : '');
  const valorNumerico = Number(valor.replace(',', '.'));
  const validacao = validarDadosParaFechamento({ nome_lead: nome, valor: valorNumerico });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-fechamento" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="titulo-fechamento" className="text-lg font-bold text-foreground">Concluir venda</h2>
        <p className="mt-1 text-sm text-gray-600">
          Preencha os dados obrigatórios antes de mover o lead para Fechado.
        </p>
        <label className="mt-5 block text-sm font-medium text-gray-700">
          Nome do lead
          <input value={nome} onChange={(event) => setNome(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700">
          Valor da venda
          <input type="number" min="0.01" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>
        {!validacao.valido && (
          <ul className="mt-3 list-disc pl-5 text-xs text-red-600">
            {validacao.erros.map((erro) => <li key={erro}>{erro}</li>)}
          </ul>
        )}
        {erroServidor && <p className="mt-3 text-xs text-red-600">{erroServidor}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={salvando} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button
            type="button"
            disabled={!validacao.valido || salvando}
            onClick={() => onConfirm({ nome_lead: nome.trim(), valor: valorNumerico })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {salvando ? 'Concluindo...' : 'Salvar e fechar venda'}
          </button>
        </div>
      </div>
    </div>
  );
}
