import {NavLink} from 'react-router-dom';


const links = [
    {to: '/', label: 'Dashboard'},
    {to: '/deposits', label: 'Deposits'},
    {to:'/desposits', label: 'Desposits'},
    {to:'/withdrawals', label: 'Withdrawals'}, 
];

export default function Navbar() {
    return (
        <nav className="bg-[#161b27] border-b border-slate-700 px-6 py-4 flex items-center gap-8">
         <span className="text-amber-400 font-bold tracking-widest text-sm uppercase">
        BareMetal Custody
        </span>
        <div className='flex gap-6'>
            {links.map(({to,label})=>(
                <NavLink
                key={to}
                to={to}
                end={to==='/'}
                className={({isActive})=>`text-slate-400 hover:text-slate-100 transition-colors ${isActive ? 'text-white' : ''}`}
                >
                    {label}
                </NavLink>
            ))}
        </div>

       </nav>
    );
}