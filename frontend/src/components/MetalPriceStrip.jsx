import client from '../api/client';
import {useEffect, useState} from 'react';

const ICONS = { GOLD: '🥇', SILVER: '🥈', PLATINUM: '⬜' };

export default function MetalPriceStrip() {
    const [metals, setMetals] = useState([]);

    useEffect(() => {
        client.get('/api/metals')
        .then(response => setMetals(response.data.metals))
        .catch(error => console.error('Error fetching metals:', error));
    }, []);

    return (
        <div className="bg-[#0f1117] border-b border-slate-800 px-6 py-2 flex gap-8">
      {metals.map(m => (
        <div key={m.id} className="flex items-center gap-2 text-sm">
          <span>{ICONS[m.code] ?? '⬡'}</span>
          <span className="text-slate-400 uppercase tracking-widest text-xs">{m.code}</span>
          <span className="text-emerald-400 font-mono font-semibold">
            ${parseFloat(m.spot_price_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-slate-500 text-xs">/ oz</span>
        </div>
      ))}
    </div>
    );

   
}