import {Outlet} from 'react-router-dom';
import Navbar from './Navbar';
import MetalPriceStrip from './MetalPriceStrip';


export default function Layout() {
    return (
        <div className="min-h-screen bg-[#0f1117] flex flex-col">
          <Navbar />
          <MetalPriceStrip />
          <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
            <Outlet />
          </main>
        </div>
      );
}