// Live net-salary demo on the home page.
import { netSalary } from '../calc/labor.js';
import { brl, parseNumber, num } from '../lib/format.js';
import { animateValue } from './animate.js';
import { track } from './track.js';

const form = document.querySelector('[data-demo]');
if (form) {
  const input = form.querySelector('input');
  const out = form.querySelector('[data-demo-net]');
  const inss = form.querySelector('[data-demo-inss]');
  const irrf = form.querySelector('[data-demo-irrf]');
  const fgts = form.querySelector('[data-demo-fgts]');
  let used = false;
  let last = parseNumber(input.value);

  const update = () => {
    const gross = parseNumber(input.value);
    if (!(gross > 0 && gross < 10_000_000)) {
      out.textContent = 'R$ —';
      return;
    }
    const r = netSalary({ gross });
    animateValue(out, netSalary({ gross: last > 0 ? last : gross }).net, r.net);
    inss.textContent = brl(r.inss.value);
    irrf.textContent = brl(r.irrf.value);
    fgts.textContent = brl(r.fgts);
    last = gross;
    if (!used) {
      used = true;
      track('calculator_start', { calculator: 'home_demo' });
    }
  };
  input.addEventListener('input', update);
  input.addEventListener('blur', () => {
    const v = parseNumber(input.value);
    if (Number.isFinite(v)) input.value = num(v, 2);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    location.href = '/salario-liquido/';
  });
}
