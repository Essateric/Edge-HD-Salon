import { BellRing, Settings, User, Calendar, ClipboardList, Scissors } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import edgeLogo from '@assets/edgeicon_1024.png';

export default function AppHeader() {
  const [location] = useLocation();
  
  const navigateHome = () => {
    // Always redirect to home regardless of current location
    window.location.href = '/';
  };
  
  return (
    <header className="border-b border-gray-800 bg-background py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <div 
          className="flex items-center mr-8 cursor-pointer" 
          onClick={navigateHome}
        >
          <img src={edgeLogo} alt="The Edge Salon Logo" className="h-12 w-12" />
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/calendar">
            <span className={`flex items-center cursor-pointer ${location === '/calendar' ? 'text-[#B08D57] font-medium' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
              <Calendar className="h-4 w-4 mr-2" />
              <span>Calendar</span>
            </span>
          </Link>

          <Link href="/services">
            <span className={`flex items-center cursor-pointer ${location === '/services' ? 'text-[#B08D57] font-medium' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
              <Scissors className="h-4 w-4 mr-2" />
              <span>Services</span>
            </span>
          </Link>
        </nav>
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