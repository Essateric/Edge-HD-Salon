import React, { useEffect, useState } from 'react';
import SimpleStylistView from '@/components/SimpleStylistView';
import EdgeSalonTopBar from '@/components/EdgeSalonTopBar';
import { Appointment, Stylist } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function StylistColumnView() {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Just a short delay to ensure the page is fully rendered
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleEditAppointment = (appointment: any) => {
    console.log('Edit appointment:', appointment);
    // Add your edit appointment functionality here
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <EdgeSalonTopBar />
        <div className="flex items-center justify-center flex-grow">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <EdgeSalonTopBar />
      
      <div className="px-4 py-4 flex-grow">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Stylist Column Calendar</h1>
        </div>
        
        <div className="bg-background rounded-lg shadow-sm border border-border p-4 h-[calc(100vh-180px)]">
          <SimpleStylistView onAppointmentClick={handleEditAppointment} />
        </div>
      </div>
    </div>
  );
}