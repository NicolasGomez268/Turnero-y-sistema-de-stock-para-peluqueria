import PropTypes from 'prop-types';

/**
 * Componente de paginación reutilizable.
 * Muestra flechas, número de página y total de items.
 */
const Pagination = ({ paginaActual, totalItems, itemsPorPagina, onCambiarPagina }) => {
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina);
  if (totalPaginas <= 1) return null;

  const inicio = (paginaActual - 1) * itemsPorPagina + 1;
  const fin    = Math.min(paginaActual * itemsPorPagina, totalItems);

  const btnBase =
    'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150';
  const btnActivo =
    'bg-oro-base text-tincho-dark hover:bg-oro-brillo';
  const btnDeshabilitado =
    'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50';
  const btnNormal =
    'bg-gray-700 text-gray-300 hover:bg-gray-600';

  // Genera el rango de páginas visibles (máx 5 botones)
  const getPaginas = () => {
    if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const arr = [];
    const start = Math.max(2, paginaActual - 1);
    const end   = Math.min(totalPaginas - 1, paginaActual + 1);
    arr.push(1);
    if (start > 2) arr.push('...');
    for (let i = start; i <= end; i++) arr.push(i);
    if (end < totalPaginas - 1) arr.push('...');
    arr.push(totalPaginas);
    return arr;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-1">
      {/* Contador */}
      <p className="text-gray-400 text-sm">
        Mostrando <span className="text-white font-semibold">{inicio}–{fin}</span> de{' '}
        <span className="text-white font-semibold">{totalItems}</span> items
      </p>

      {/* Botones */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className={`${btnBase} ${paginaActual === 1 ? btnDeshabilitado : btnNormal}`}
        >
          ← Ant.
        </button>

        {getPaginas().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-500 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onCambiarPagina(p)}
              className={`${btnBase} ${p === paginaActual ? btnActivo : btnNormal}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className={`${btnBase} ${paginaActual === totalPaginas ? btnDeshabilitado : btnNormal}`}
        >
          Sig. →
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  paginaActual:    PropTypes.number.isRequired,
  totalItems:      PropTypes.number.isRequired,
  itemsPorPagina:  PropTypes.number.isRequired,
  onCambiarPagina: PropTypes.func.isRequired,
};

export default Pagination;
