import {NavLink} from 'react-router-dom';


const links = [
    {to: '/', label: 'Dashboard'},
    {to: '/customers', label: 'Customers'},
    {to:'/deposits/new', label: 'New Deposit'},
    {to:'/withdrawals/new', label: 'New Withdrawal'},
];

export default function Navbar() {
    return (
        <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-8">
         <span className="text-amber-600 font-bold tracking-widest text-sm uppercase">
        BareMetal Custody
        </span>
        <div className='flex gap-6'>
            {links.map(({to,label})=>(
                <NavLink
                key={to}
                to={to}
                end={to==='/'}
                className={({isActive})=>`text-slate-600 hover:text-slate-900 transition-colors ${isActive ? 'text-amber-700 font-semibold' : ''}`}
                >
                    {label}
                </NavLink>
            ))}
        </div>

       </nav>
    );
}