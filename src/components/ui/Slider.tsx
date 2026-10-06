interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  onCommit?: () => void;
  id?: string;
}

export function Slider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  suffix = '',
  onChange,
  onCommit,
  id,
}: SliderProps) {
  const inputId = id ?? `slider-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="col gap-1">
      {label && (
        <label className="label" htmlFor={inputId} style={{ textTransform: 'none', letterSpacing: 0 }}>
          {label}
        </label>
      )}
      <div className="slider-row">
        <input
          id={inputId}
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={onCommit}
          onKeyUp={onCommit}
        />
        <span className="slider-val mono">
          {Math.round(value)}
          {suffix}
        </span>
      </div>
    </div>
  );
}
