import { BellRing, Settings, User } from 'lucide-react';
import { useLocation } from 'wouter';
import edgeLogo from '@assets/edgeicon_1024.png';

export default function AppHeader() {
  const [location] = useLocation();
  
  return (
    <header className="border-b border-gray-800 bg-background py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex items-center mr-8">
          <img src={edgeLogo} alt="The Edge Salon Logo" className="h-12 w-12" />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-gray-300 transition-colors">
          <BellRing className="h-5 w-5" />
        </button>
        <button className="text-gray-400 hover:text-gray-300 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-[#B08D57] text-white grid place-items-center">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}