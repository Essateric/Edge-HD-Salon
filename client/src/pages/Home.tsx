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
    <div className="flex flex-col h-screen">
      <AppHeader user={user} />
      <NavigationBar activeView="calendar" />
      <CalendarView />
    </div>
  );
}
