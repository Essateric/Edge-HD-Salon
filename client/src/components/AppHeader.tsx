import { BellRing, Calendar, Settings, User } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AppHeader() {
  const [location] = useLocation();
  
  return (
    <header className="border-b bg-white py-3 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex items-center mr-8">
          <div className="font-bold text-2xl text-primary">
            <span className="text-3xl mr-1">THE</span>
            EDGE
            <span className="text-sm align-top ml-1">HD</span>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-normal">SALON</div>
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <a
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === '/' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Calendar
          </a>
          <a
            href="/services"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === '/services' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Services
          </a>
          <a
            href="/clients"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === '/clients' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Clients
          </a>
          <a
            href="/reports"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location === '/reports' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            Reports
          </a>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <BellRing className="h-5 w-5" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary text-white grid place-items-center">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}