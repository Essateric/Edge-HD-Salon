import { PlusIcon, CalendarIcon, UsersIcon, BarChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationBarProps {
  activeView: string;
}

export default function NavigationBar({ activeView }: NavigationBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4">
      <div className="flex items-center justify-between">
        <div className="flex">
          <a 
            href="#" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'calendar' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'calendar' ? 'font-medium' : ''}>Calendar</span>
          </a>
          <a 
            href="#" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'clients' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'clients' ? 'font-medium' : ''}>Clients</span>
          </a>
          <a 
            href="#" 
            className={`flex items-center px-4 py-3 border-b-2 ${
              activeView === 'reports' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChartIcon className="h-5 w-5 mr-2" />
            <span className={activeView === 'reports' ? 'font-medium' : ''}>Reports</span>
          </a>
        </div>
        <div>
          <Button className="bg-primary text-white rounded-md px-4 py-2 flex items-center shadow-sm">
            <PlusIcon className="h-5 w-5 mr-1" />
            <span>New Booking</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
