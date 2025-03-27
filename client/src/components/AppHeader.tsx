import { User } from 'lucide-react';

interface AppHeaderProps {
  user: {
    initials: string;
    name: string;
  };
}

export default function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-2 text-lg font-medium flex items-center">
            <svg className="h-5 w-5 text-primary mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
            Shortcuts
          </span>
        </div>
        <div className="flex items-center">
          <button className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-100 mr-2">
            <span className="hidden md:inline">Shortcuts</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-medium">
            <span>{user.initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
