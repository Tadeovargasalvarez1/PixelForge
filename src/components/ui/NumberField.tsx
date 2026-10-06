interface NumberFieldProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

export function NumberField({ label, value, min, max, step = 1, suffix, onChange, onCommit }: NumberFieldProps) {
  return (
    <label className="field">
      {label && <span className="label" style={{ textTransform: 'none', letterSpacing: 0 }}>{label}</span>}
      <div className="row gap-2">
        <input
          className="input mono"
          type="number"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onCommit}
        />
        {suffix && <span className="dim" style={{ fontSize: '0.8rem' }}>{suffix}</span>}
      </div>
    </label>
  );
}
