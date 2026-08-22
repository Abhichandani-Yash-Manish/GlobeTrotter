'use client';

import { ArrowRightLeft, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import {
  REFERENCE_RATE_DATE,
  baseToDisplayAmount,
  displayToBaseAmount,
  formatCurrencyAmount,
  type DisplayCurrency,
} from '@/lib/format';

const TARGET_CURRENCIES: Array<{ code: Exclude<DisplayCurrency, 'INR'>; label: string }> = [
  { code: 'USD', label: 'US dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'Pound sterling' },
  { code: 'AED', label: 'UAE dirham' },
];

export function CurrencyPocket() {
  const [rupees, setRupees] = useState('25000');
  const [target, setTarget] = useState<Exclude<DisplayCurrency, 'INR'>>('USD');
  const inrAmount = Number(rupees);
  const converted = Number.isFinite(inrAmount) && inrAmount >= 0
    ? baseToDisplayAmount(displayToBaseAmount(inrAmount, 'INR'), target)
    : 0;

  return (
    <aside className="currency-pocket" aria-labelledby="currency-pocket-title">
      <div className="currency-pocket-heading">
        <span id="currency-pocket-title"><IndianRupee size={17} /> FX POCKET GUIDE</span>
        <small>REFERENCE · {REFERENCE_RATE_DATE.toUpperCase()}</small>
      </div>
      <div className="currency-pocket-controls">
        <label>
          <span>Indian rupees</span>
          <div className="currency-input"><strong>₹</strong><input type="number" min="0" step="100" value={rupees} onChange={(event) => setRupees(event.target.value)} aria-label="Amount in Indian rupees" /></div>
        </label>
        <ArrowRightLeft size={18} aria-hidden="true" />
        <label>
          <span>Compare with</span>
          <select value={target} onChange={(event) => setTarget(event.target.value as Exclude<DisplayCurrency, 'INR'>)} aria-label="Comparison currency">
            {TARGET_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.label}</option>)}
          </select>
        </label>
        <output aria-live="polite">{formatCurrencyAmount(converted, target)}</output>
      </div>
      <p>Offline planning estimate derived from ECB reference cross-rates. Not a live exchange or booking quote.</p>
    </aside>
  );
}
