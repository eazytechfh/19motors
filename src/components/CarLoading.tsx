interface CarLoadingProps {
  mensagem?: string;
}

export function CarLoading({ mensagem = 'Carregando...' }: CarLoadingProps) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <div className="car-loading-track" aria-hidden="true">
        <div className="car-loading-car">
          <span className="car-loading-body" />
          <span className="car-loading-wheel car-loading-wheel-left" />
          <span className="car-loading-wheel car-loading-wheel-right" />
        </div>
      </div>
      <span className="text-sm text-gray-500">{mensagem}</span>
    </div>
  );
}
