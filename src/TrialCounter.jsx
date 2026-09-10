import React from "react";

const MAX_DAYS = 7;

// value: número de 1 a 7, o null para ilimitado.
const TrialCounter = ({ value, onChange }) => {
  const down = () => {
    if (value === null) return onChange(MAX_DAYS);
    onChange(Math.max(1, value - 1));
  };

  const up = () => {
    if (value === null) return;          // ya es ilimitado, no hay nada arriba
    if (value >= MAX_DAYS) return onChange(null);
    onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
      <button
        type="button"
        onClick={down}
        className="px-2 text-lg leading-none"
        aria-label="Menos días"
      >
        −
      </button>

      <span className="w-24 text-center text-sm">
        {value === null ? "-- ilimitado" : `${value} días`}
      </span>

      <button
        type="button"
        onClick={up}
        className="px-2 text-lg leading-none"
        aria-label="Más días"
      >
        +
      </button>
    </div>
  );
};

export default TrialCounter;
