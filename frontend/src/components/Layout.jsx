import {Outlet} from 'react-router-dom';
import Navbar from './Navbar';
import MetalPriceStrip from './MetalPriceStrip';


export default function Layout() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
          <Navbar />
          <MetalPriceStrip />
          <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 bg-white">
            <Outlet />
          </main>
        </div>
      );
}