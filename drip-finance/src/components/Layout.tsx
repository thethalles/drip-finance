import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Wallet, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-secondary relative overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-16 bg-primary rounded-full flex items-center justify-around px-6 shadow-lg z-50">
        <NavLink to="/" className={({ isActive }) => cn("p-2 rounded-full transition-colors", isActive ? "bg-[#638F63]" : "text-white/70")}>
          <Home size={28} />
        </NavLink>
        <NavLink to="/statistics" className={({ isActive }) => cn("p-2 rounded-full transition-colors", isActive ? "bg-[#638F63]" : "text-white/70")}>
          <BarChart2 size={28} />
        </NavLink>
        <NavLink to="/wallets" className={({ isActive }) => cn("p-2 rounded-full transition-colors", isActive ? "bg-[#638F63]" : "text-white/70")}>
          <Wallet size={28} />
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => cn("p-2 rounded-full transition-colors", isActive ? "bg-[#638F63]" : "text-white/70")}>
          <User size={28} />
        </NavLink>
      </nav>
    </div>
  );
}
