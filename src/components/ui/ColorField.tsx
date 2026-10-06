interface ColorFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="field">
      {label && <span className="label" style={{ textTransform: 'none', letterSpacing: 0 }}>{label}</span>}
      <div className="row gap-2">
        <label className="swatch" style={{ background: value }} aria-label={label ?? 'Color'}>
          <input type="color" value={normalize(value)} onChange={(e) => onChange(e.target.value)} />
        </label>
        <input
          className="input mono"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label={`${label ?? 'Color'} HEX`}
        />
      </div>
    </div>
  );
}

function normalize(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return '#000000';
}
