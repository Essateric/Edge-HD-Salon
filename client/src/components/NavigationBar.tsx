import { PlusIcon, CalendarIcon, UsersIcon, BarChartIcon, ScissorsIcon, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useState } from 'react';

interface NavigationBarProps {
  activeView: string;
}

export default function NavigationBar({ activeView }: NavigationBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-background border-b border-gray-800 px-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <MenuIcon className="h-6 w-6 text-gray-400" />
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex">
          <Link 
            href="/calendar" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'calendar' 
                ? 'border-[#B08D57] text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-semibold' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'calendar' ? 'font-medium' : ''}>Calendar</span>
          </Link>
          <Link 
            href="/services" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'services' 
                ? 'border-[#B08D57] text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-semibold' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <ScissorsIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'services' ? 'font-medium' : ''}>Services</span>
          </Link>
          <Link 
            href="/clients" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'clients' 
                ? 'border-[#B08D57] text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-semibold' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'clients' ? 'font-medium' : ''}>Clients</span>
          </Link>
          <Link 
            href="/reports" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'reports' 
                ? 'border-[#B08D57] text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-semibold' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <BarChartIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'reports' ? 'font-medium' : ''}>Reports</span>
          </Link>
        </div>

        {/* New Booking button */}
        <div>
          <Button className="bg-gradient-to-r from-[#D4B78E] via-[#B08D57] to-[#8B734A] hover:from-[#B08D57] hover:to-[#6A563B] text-white rounded-md px-4 py-2 flex items-center shadow-md border border-[#D4B78E]/30">
            <PlusIcon className="h-5 w-5 mr-1" />
            <span className="hidden sm:inline">New Booking</span>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-2">
          <Link 
            href="/calendar" 
            className={`flex items-center px-4 py-2 ${
              activeView === 'calendar' ? 'text-[#B08D57]' : 'text-gray-400'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span>Calendar</span>
          </Link>
          <Link 
            href="/services" 
            className={`flex items-center px-4 py-2 ${
              activeView === 'services' ? 'text-[#B08D57]' : 'text-gray-400'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <ScissorsIcon className="h-5 w-5 mr-2" />
            <span>Services</span>
          </Link>
          <Link 
            href="/clients" 
            className={`flex items-center px-4 py-2 ${
              activeView === 'clients' ? 'text-[#B08D57]' : 'text-gray-400'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            <span>Clients</span>
          </Link>
          <Link 
            href="/reports" 
            className={`flex items-center px-4 py-2 ${
              activeView === 'reports' ? 'text-[#B08D57]' : 'text-gray-400'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BarChartIcon className="h-5 w-5 mr-2" />
            <span>Reports</span>
          </Link>
        </div>
      )}
    </div>
  );
}
