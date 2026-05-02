import client from '../api/client';
import {useEffect, useState} from 'react';

const ICONS = { GOLD: '🥇', SILVER: '🥈', PLATINUM: '⬜' };

export default function MetalPriceStrip() {
    const [metals, setMetals] = useState([]);

    useEffect(() => {
        client.get('/metals')
        .then(response => setMetals(response.data.metals))
        .catch(error => console.error('Error fetching metals:', error));
    }, []);

    return (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex gap-8">
      {metals.map(m => (
        <div key={m.id} className="flex items-center gap-2 text-sm">
          <span>{ICONS[m.code] ?? '⬡'}</span>
          <span className="text-slate-600 uppercase tracking-widest text-xs">{m.code}</span>
          <span className="text-emerald-400 font-mono font-semibold">
            ${parseFloat(m.spot_price_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-slate-500 text-xs">/ kg</span>
        </div>
      ))}
    </div>
    );

   
}