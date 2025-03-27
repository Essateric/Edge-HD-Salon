import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import NavigationBar from '@/components/NavigationBar';
import CalendarView from '@/pages/CalendarView';

export default function Home() {
  const [user, setUser] = useState({
    initials: 'MK',
    name: 'Mia Kim'
  });
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <NavigationBar activeView="calendar" />
      <div className="flex-1 h-full overflow-hidden">
        <CalendarView />
      </div>
    </div>
  );
}
