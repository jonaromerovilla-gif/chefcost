import type { ReactNode } from 'react';
import { planFor, type Feature } from '../plans';

export function NumField({ value, onChange, step = 'any', min = 0, className }: {
  value: number;
  onChange: (v: number) => void;
  step?: string;
  min?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      className={className ?? 'num'}
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={min}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
    />
  );
}

export function Kpi({ label, value, tone, hint }: { label: string; value: string; tone?: 'good' | 'bad'; hint?: string }) {
  return (
    <div className={`kpi ${tone ?? ''}`}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}

export function Locked({ feature, children }: { feature: Feature; children?: ReactNode }) {
  const plan = planFor(feature);
  return (
    <div className="locked">
      <span className="badge">Plan {plan.name}</span>
      <p>{children ?? 'Esta función está disponible en un plan superior.'}</p>
      <p className="muted">Cámbialo en Ajustes → Plan.</p>
    </div>
  );
}

export function FoodCostTag({ value, target }: { value: number; target: number }) {
  const tone = value <= target ? 'good' : value <= target + 5 ? 'warn' : 'bad';
  return <span className={`tag ${tone}`}>{value.toFixed(1)} %</span>;
}
