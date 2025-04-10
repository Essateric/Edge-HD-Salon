import React, { useEffect, useState } from 'react';
import SimpleStylistView from '@/components/SimpleStylistView';
import EdgeSalonTopBar from '@/components/EdgeSalonTopBar';
import { Appointment, Stylist } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function StylistColumnView() {
  const [loading, setLoading] = useState(true);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  
  useEffect(() => {
    // Fetch stylists from the database
    async function fetchData() {
      try {
        const stylistsResponse = await fetch('/api/stylists', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (stylistsResponse.ok) {
          const stylistsData = await stylistsResponse.json();
          setStylists(stylistsData);
        } else {
          console.warn('Could not fetch stylists, using sample data');
          // Fallback sample data
          setStylists([
            { id: 1, name: "Martin", imageUrl: "" },
            { id: 2, name: "Darren", imageUrl: "" },
            { id: 3, name: "Annaliese", imageUrl: "" }
          ]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stylists:', error);
        // Fallback sample data
        setStylists([
          { id: 1, name: "Martin", imageUrl: "" },
          { id: 2, name: "Darren", imageUrl: "" },
          { id: 3, name: "Annaliese", imageUrl: "" }
        ]);
        setLoading(false);
      }
    }
    
    fetchData();
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
          <SimpleStylistView 
            stylists={stylists}
            onAppointmentClick={handleEditAppointment} 
          />
        </div>
      </div>
    </div>
  );
}