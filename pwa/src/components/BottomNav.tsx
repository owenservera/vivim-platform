import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-gray-200 flex items-center justify-around z-50 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <Home className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>
      
      <NavLink 
        to="/search" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <Search className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-[10px] font-medium">Search</span>
      </NavLink>
      
      <NavLink 
        to="/capture" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <div className="bg-blue-600 rounded-full p-2 text-white shadow-lg shadow-blue-500/30 transform transition-transform active:scale-95">
           <PlusCircle className="w-6 h-6 text-white" fill="currentColor" strokeWidth={0} />
        </div>
      </NavLink>
      
      <NavLink 
        to="/ai-conversations" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-[10px] font-medium">AI</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
      >
        <Settings className="w-6 h-6" strokeWidth={2.5} />
        <span className="text-[10px] font-medium">Settings</span>
      </NavLink>
    </nav>
  );
};
