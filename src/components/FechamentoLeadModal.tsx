'use client';

import { useEffect, useMemo, useState } from 'react';
import { validarDadosParaFechamento } from '@/lib/leads/fechamento';
import { normalizarStatusEstoque } from '@/lib/estoque/status';
import { createClient } from '@/lib/supabase/client';

type VeiculoVenda = {
  id: number;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  placa: string | null;
  status: string | null;
};

function textoVeiculo(veiculo: VeiculoVenda) {
  return [veiculo.marca, veiculo.modelo, veiculo.ano, veiculo.placa].filter(Boolean).join(' · ');
}

function normalizarBusca(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

interface FechamentoLeadModalProps {
  nomeInicial: string;
  valorInicial: number | null;
  salvando: boolean;
  erroServidor: string | null;
  onCancel: () => void;
  onConfirm: (dados: { nome_lead: string; valor: number; veiculoId: string }) => void;
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
  const [veiculos, setVeiculos] = useState<VeiculoVenda[]>([]);
  const [veiculoId, setVeiculoId] = useState('');
  const [buscaVeiculo, setBuscaVeiculo] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
  const valorNumerico = Number(valor.replace(',', '.'));
  const validacao = validarDadosParaFechamento({ nome_lead: nome, valor: valorNumerico });
  const filteredVehicles = useMemo(() => {
    const termo = normalizarBusca(buscaVeiculo.trim());
    if (!termo) return veiculos;
    return veiculos.filter((veiculo) => normalizarBusca(textoVeiculo(veiculo)).includes(termo));
  }, [buscaVeiculo, veiculos]);

  useEffect(() => {
    let ativo = true;
    void createClient().from('ESTOQUE').select('id, marca, modelo, ano, placa, status').order('marca')
      .then(({ data, error }) => {
        if (!ativo) return;
        const disponiveis = error ? [] : ((data ?? []) as VeiculoVenda[]).filter(
          (veiculo) => normalizarStatusEstoque(veiculo.status ?? '') === 'disponivel'
        );
        setVeiculos(disponiveis);
        setCarregandoVeiculos(false);
      });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-fechamento" className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <h2 id="titulo-fechamento" className="text-lg font-bold text-foreground">Concluir venda</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Preencha os dados obrigatórios antes de mover o lead para Fechado.
        </p>
        <label className="mt-5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nome do lead
          <input value={nome} onChange={(event) => setNome(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100" />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Valor da venda
          <input type="number" min="0.01" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100" />
        </label>
        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">Veículo vendido</label>
        <div className="relative mt-1">
          <input
            role="combobox"
            aria-expanded={listaAberta}
            aria-controls="lista-veiculos-venda"
            autoComplete="off"
            value={buscaVeiculo}
            placeholder="Digite marca, modelo, ano ou placa"
            disabled={carregandoVeiculos}
            onFocus={() => setListaAberta(true)}
            onChange={(event) => {
              setBuscaVeiculo(event.target.value);
              setVeiculoId('');
              setListaAberta(true);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-9 dark:border-gray-700 dark:bg-white/5 dark:text-gray-100"
          />
          <button
            type="button"
            aria-label="Abrir lista de veículos"
            disabled={carregandoVeiculos}
            onClick={() => setListaAberta((aberta) => !aberta)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-gray-500 dark:text-gray-400"
          >
            ⌄
          </button>
          {listaAberta && !carregandoVeiculos && (
            <div id="lista-veiculos-venda" role="listbox" className="absolute left-0 top-full z-[90] mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-card p-1 shadow-xl dark:border-gray-700">
              {filteredVehicles.length ? filteredVehicles.map((veiculo) => (
                <button
                  key={veiculo.id}
                  type="button"
                  role="option"
                  aria-selected={veiculoId === String(veiculo.id)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setVeiculoId(String(veiculo.id));
                    setBuscaVeiculo(textoVeiculo(veiculo));
                    setListaAberta(false);
                  }}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${veiculoId === String(veiculo.id) ? 'bg-primary/10 font-medium text-primary' : 'text-gray-800 dark:text-gray-200'}`}
                >
                  {textoVeiculo(veiculo)}
                </button>
              )) : <p className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">Nenhum veículo encontrado.</p>}
            </div>
          )}
        </div>
        {!carregandoVeiculos && veiculos.length === 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">Nenhum veículo disponível no estoque.</p>
        )}
        {!validacao.valido && (
          <ul className="mt-3 list-disc pl-5 text-xs text-red-600 dark:text-red-400">
            {validacao.erros.map((erro) => <li key={erro}>{erro}</li>)}
          </ul>
        )}
        {erroServidor && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{erroServidor}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={salvando} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
          <button
            type="button"
            disabled={!validacao.valido || !veiculoId || salvando}
            onClick={() => onConfirm({ nome_lead: nome.trim(), valor: valorNumerico, veiculoId })}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {salvando ? 'Concluindo...' : 'Salvar e fechar venda'}
          </button>
        </div>
      </div>
    </div>
  );
}
