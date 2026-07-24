export const STATUS_ESTOQUE = ['disponivel', 'indisponivel', 'vendido'] as const;
export type StatusEstoque = (typeof STATUS_ESTOQUE)[number];

export function normalizarStatusEstoque(status: string | null | undefined): string {
  return (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

interface VeiculoFiltravel {
  status: string;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
}

interface FiltrosEstoque {
  busca: string;
  marca: string;
  status: string;
}

export function filtrarEstoque<T extends VeiculoFiltravel>(
  veiculos: T[],
  filtros: FiltrosEstoque
): T[] {
  const termo = filtros.busca.trim().toLowerCase();
  return veiculos.filter((veiculo) => {
    if (
      termo &&
      ![veiculo.marca, veiculo.modelo, veiculo.placa].some((campo) =>
        campo?.toLowerCase().includes(termo)
      )
    ) {
      return false;
    }
    if (filtros.marca !== 'todas' && veiculo.marca !== filtros.marca) return false;
    return (
      filtros.status === 'todos' ||
      normalizarStatusEstoque(veiculo.status) === filtros.status
    );
  });
}
