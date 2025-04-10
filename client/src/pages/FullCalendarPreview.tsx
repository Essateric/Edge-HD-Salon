import React, { useEffect, useState } from 'react';
import FullCalendarView from '@/components/FullCalendarView';
import SimpleCalendar from '@/components/SimpleCalendar';
import StylistCalendarView from '@/components/StylistCalendarView';
import EdgeSalonTopBar from '@/components/EdgeSalonTopBar';
import { Appointment, Stylist } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FullCalendarPreview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('data-calendar');
  
  useEffect(() => {
    // Fetch appointments
    async function fetchData() {
      try {
        const apptsResponse = await apiRequest('GET', '/api/appointments');
        const stylistsResponse = await apiRequest('GET', '/api/stylists');
        
        const apptsData = await apptsResponse.json();
        const stylistsData = await stylistsResponse.json();
        
        setAppointments(apptsData);
        setStylists(stylistsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleEditAppointment = (appointment: Appointment) => {
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
          <h1 className="text-2xl font-bold">FullCalendar Preview</h1>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-gradient-to-r from-[#D4B78E] to-[#8B734A] text-white rounded-md"
              onClick={() => {
                // Navigate to today
                const calendarApi = document.querySelector('.fc')?.querySelector('.fc-toolbar-chunk')?.querySelector('.fc-today-button');
                if (calendarApi instanceof HTMLElement) {
                  calendarApi.click();
                }
              }}
            >
              Today
            </button>
          </div>
        </div>
        
        <div className="bg-background rounded-lg shadow-sm border border-border p-4 h-[calc(100vh-200px)]">
          <Tabs defaultValue="stylist-calendar" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="stylist-calendar">Stylist-Based Calendar</TabsTrigger>
              <TabsTrigger value="data-calendar">Day-Based Calendar</TabsTrigger>
              <TabsTrigger value="simple-calendar">Simple Example</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stylist-calendar" className="h-full">
              {activeTab === 'stylist-calendar' && (
                <StylistCalendarView 
                  onAppointmentClick={handleEditAppointment}
                />
              )}
            </TabsContent>
            
            <TabsContent value="data-calendar" className="h-full">
              {activeTab === 'data-calendar' && (
                <FullCalendarView 
                  appointments={appointments} 
                  stylists={stylists}
                  onEditAppointment={handleEditAppointment}
                />
              )}
            </TabsContent>
            
            <TabsContent value="simple-calendar" className="h-full">
              {activeTab === 'simple-calendar' && <SimpleCalendar />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}