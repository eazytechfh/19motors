export interface DadosFechamento {
  nome_lead: string | null | undefined;
  valor: number | null | undefined;
}

export interface ResultadoValidacaoFechamento {
  valido: boolean;
  erros: string[];
}

export function validarDadosParaFechamento(
  dados: DadosFechamento
): ResultadoValidacaoFechamento {
  const erros: string[] = [];
  if (!dados.nome_lead?.trim()) erros.push('Informe o nome do lead.');
  if (!Number.isFinite(dados.valor) || Number(dados.valor) <= 0) {
    erros.push('Informe um valor de venda maior que zero.');
  }
  return { valido: erros.length === 0, erros };
}
