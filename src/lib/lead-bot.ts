export function estaComBotAtivo(valor: boolean | string | null | undefined) {
  return valor === true || valor === 'true';
}
