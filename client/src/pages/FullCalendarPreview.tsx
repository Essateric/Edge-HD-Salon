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
  const [activeTab, setActiveTab] = useState('stylist-calendar');
  
  useEffect(() => {
    // Fetch appointments
    async function fetchData() {
      try {
        let apptsData = [];
        let stylistsData = [];
        
        try {
          const apptsResponse = await apiRequest('GET', '/api/appointments');
          apptsData = await apptsResponse.json();
        } catch (error) {
          console.error('Error fetching appointments:', error);
          apptsData = [];
        }
        
        try {
          const stylistsResponse = await apiRequest('GET', '/api/stylists');
          stylistsData = await stylistsResponse.json();
        } catch (error) {
          console.error('Error fetching stylists:', error);
          stylistsData = [];
        }
        
        // If no data was fetched, use sample data for demonstration
        if (apptsData.length === 0 || stylistsData.length === 0) {
          stylistsData = [
            { id: 1, name: "Martin", imageUrl: "" },
            { id: 2, name: "Darren", imageUrl: "" },
            { id: 3, name: "Annaliese", imageUrl: "" }
          ];
          
          // Sample appointments spanning across stylists
          apptsData = [
            {
              id: 1,
              customerId: 1,
              customerName: "Jane Smith",
              stylistId: 1,
              serviceId: 3,
              serviceName: "Cut & Blow Dry",
              date: "2025-04-10",
              startTime: "10:00 am",
              endTime: "11:00 am",
              duration: 60,
              notes: "First visit",
              isConsultation: false
            },
            {
              id: 2,
              customerId: 2,
              customerName: "John Doe",
              stylistId: 2,
              serviceId: 5,
              serviceName: "Beard Trim",
              date: "2025-04-10",
              startTime: "11:15 am",
              endTime: "11:45 am",
              duration: 30,
              notes: "",
              isConsultation: false
            },
            {
              id: 3,
              customerId: 3,
              customerName: "Alice Johnson",
              stylistId: 3,
              serviceId: 8,
              serviceName: "Full Colour",
              date: "2025-04-10",
              startTime: "14:00 pm",
              endTime: "16:00 pm",
              duration: 120,
              notes: "Bring reference photo",
              isConsultation: false
            }
          ];
        }
        
        setAppointments(apptsData);
        setStylists(stylistsData);
      } catch (error) {
        console.error('Error in data fetching process:', error);
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