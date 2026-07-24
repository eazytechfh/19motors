function normalizarResponsavel(valor: string | null | undefined): string {
  return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
}

export function houveTransferencia(
  responsavelAnterior: string | null | undefined,
  responsavelNovo: string | null | undefined
): boolean {
  return normalizarResponsavel(responsavelAnterior) !== normalizarResponsavel(responsavelNovo);
}

export async function tocarSomTransferencia(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const contexto = new AudioContextClass();
    await contexto.resume();
    const tocarNota = (frequencia: number, inicio: number) => {
      const oscilador = contexto.createOscillator();
      const ganho = contexto.createGain();
      oscilador.type = 'sine';
      oscilador.frequency.value = frequencia;
      ganho.gain.setValueAtTime(0.0001, inicio);
      ganho.gain.exponentialRampToValueAtTime(0.1, inicio + 0.015);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.13);
      oscilador.connect(ganho);
      ganho.connect(contexto.destination);
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.14);
      return oscilador;
    };
    tocarNota(740, contexto.currentTime);
    const ultimaNota = tocarNota(988, contexto.currentTime + 0.1);
    ultimaNota.addEventListener('ended', () => void contexto.close());
  } catch {
    // Som é feedback auxiliar; bloqueios do navegador não podem invalidar a transferência.
  }
}

export async function tocarSomVendaFechada(): Promise<void> {
  if (typeof window === 'undefined') return;
  const efeitos = [
    { src: '/effects/sale-engine.mp3', inicio: 11, volume: 0.58 },
    { src: '/effects/sale-money.mp3', inicio: 5, volume: 0.82 },
  ];

  efeitos.forEach(({ src, inicio, volume }) => {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = volume;
    const iniciar = async () => {
      try {
          audio.currentTime = inicio;
        await audio.play();
        window.setTimeout(() => {
          audio.pause();
            audio.currentTime = inicio;
        }, 5000);
      } catch {
        // O navegador pode bloquear reprodução automática mesmo após a ação do usuário.
      }
    };
      if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) void iniciar();
    else audio.addEventListener('loadedmetadata', () => void iniciar(), { once: true });
    audio.load();
    } catch {
      // Um efeito bloqueado não impede o outro nem altera a venda confirmada.
    }
  });
}
