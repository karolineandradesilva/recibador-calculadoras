// Field presets and result helpers reused across calculators.
import { brl, pct, num } from '../lib/format.js';

export const salaryField = (extra = {}) => ({
  name: 'salary',
  label: 'Salário bruto mensal',
  type: 'money',
  default: 3500,
  min: 0.01,
  max: 10000000,
  requiredMessage: 'Informe o salário bruto.',
  ...extra,
});

export const dependentsField = (extra = {}) => ({
  name: 'dependents',
  label: 'Dependentes para o IR',
  type: 'integer',
  default: 0,
  min: 0,
  max: 20,
  width: 'half',
  help: 'Filhos, cônjuge e outros dependentes declarados ao empregador.',
  ...extra,
});

export const variableField = (extra = {}) => ({
  name: 'variable',
  label: 'Média de adicionais',
  type: 'money',
  default: 0,
  min: 0,
  required: false,
  advanced: true,
  help: 'Média de horas extras, comissões e adicionais habituais (insalubridade, noturno etc.).',
  ...extra,
});

/** Converts a percent input (e.g. 12,5) to a fraction (0.125). */
export const frac = (v) => (Number.isFinite(v) ? v / 100 : 0);
export const val = (v, fallback = 0) => (Number.isFinite(v) ? v : fallback);

export const row = (label, value, tone, hint) => ({ label, value: typeof value === 'number' ? brl(value) : value, tone, hint });

export const inssHint = (inss) =>
  inss.capped ? 'Limitado ao teto do INSS' : `Alíquota efetiva de ${pct(inss.effectiveRate)}`;

export const irrfHint = (irrf) => {
  if (irrf.value === 0 && irrf.taxBeforeReduction > 0) return 'Zerado pela redução da Lei 15.270/2025';
  if (irrf.value === 0) return 'Isento';
  const method = irrf.method === 'simplified' ? 'desconto simplificado' : 'deduções legais';
  return `Base ${brl(irrf.base)} (${method})${irrf.reduction > 0 ? `, redução de ${brl(irrf.reduction)}` : ''}`;
};

export { brl, pct, num };

export const MONTH_OPTIONS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
].map((label, i) => ({ value: String(i + 1), label }));

/** Default ISO date relative to today (used for date inputs). */
export function isoToday(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
