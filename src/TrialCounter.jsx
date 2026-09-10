import React from "react";

const MAX_DAYS = 7;

// value: número de 1 a 7, o null para ilimitado.
const TrialCounter = ({ value, onChange }) => {
  const atUnlimited = value == null;   // cubre null y un undefined accidental
  const atMin = value === 1;

  const down = () => {
    if (atUnlimited) return onChange(MAX_DAYS);
    if (atMin) return;
    onChange(value - 1);
  };

  const up = () => {
    if (atUnlimited) return;
    if (value >= MAX_DAYS) return onChange(null);
    onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
      <button
        type="button"
        onClick={down}
        disabled={atMin}
        className="px-2 text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Menos días"
      >
        −
      </button>

      <span className="w-24 text-center text-sm">
        {atUnlimited ? "-- ilimitado" : `${value} días`}
      </span>

      <button
        type="button"
        onClick={up}
        disabled={atUnlimited}
        className="px-2 text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Más días"
      >
        +
      </button>
    </div>
  );
};

export default TrialCounter;
