export const REDISTRIBUIR_IGUALMENTE = '__redistribuir_igualmente__';

export function contarLeadsPorVendedor(vendedores: Array<string | null>) {
  const contagens = new Map<string, number>();
  for (const vendedor of vendedores) {
    const nome = vendedor?.trim();
    if (nome) contagens.set(nome, (contagens.get(nome) ?? 0) + 1);
  }
  return contagens;
}

export function distribuirIgualmente<T>(itens: T[], vendedores: string[]) {
  if (vendedores.length === 0) throw new Error('Não há outro vendedor ativo para receber os leads.');
  const grupos = vendedores.map((vendedor) => ({ vendedor, itens: [] as T[] }));
  itens.forEach((item, index) => grupos[index % grupos.length].itens.push(item));
  return grupos;
}

export function destinoRedistribuicao(
  destino: unknown,
  vendedorAtual: string,
): string | null {
  if (destino === null || destino === undefined || destino === '') return null;
  if (typeof destino !== 'string') throw new Error('Destino de redistribuição inválido.');

  const normalizado = destino.trim();
  if (!normalizado) return null;
  if (normalizado.localeCompare(vendedorAtual.trim(), 'pt-BR', { sensitivity: 'base' }) === 0) {
    throw new Error('Escolha um vendedor diferente para receber os leads.');
  }
  return normalizado.slice(0, 120);
}
