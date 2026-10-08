// Converts raw form values (strings from inputs, or defaults) into the typed
// values calculators receive. Shared by the browser runtime and the build.
import { parseHours, parseNumber } from '../lib/format.js';

export function parseValue(field, raw) {
  switch (field.type) {
    case 'money':
    case 'number':
    case 'percent':
      return raw === '' || raw == null ? null : parseNumber(raw);
    case 'integer': {
      if (raw === '' || raw == null) return null;
      return parseNumber(raw);
    }
    case 'hours':
    case 'time':
      return raw === '' || raw == null ? null : parseHours(raw);
    case 'checkbox':
      return Boolean(raw);
    case 'select':
    case 'radio':
      return field.numeric ? Number(raw) : raw;
    default:
      return raw === '' || raw == null ? null : raw;
  }
}

export function rawDefaults(fields) {
  return Object.fromEntries(
    fields.map((f) => [f.name, typeof f.default === 'function' ? f.default() : f.default ?? (f.type === 'checkbox' ? false : '')]),
  );
}

export function parsedDefaults(fields) {
  const raw = rawDefaults(fields);
  return Object.fromEntries(fields.map((f) => [f.name, parseValue(f, raw[f.name])]));
}
