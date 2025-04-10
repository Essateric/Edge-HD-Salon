import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { Appointment, Stylist } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

// Import our custom CSS for FullCalendar
import '@/styles/fullcalendar.css';

interface FullCalendarComponentProps {
  onAppointmentClick?: (appointment: Appointment) => void;
}

const FullCalendarComponent: React.FC<FullCalendarComponentProps> = ({ 
  onAppointmentClick 
}) => {
  // Fetch all appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const res = await apiRequest('/api/appointments', 'GET');
      return res.json();
    }
  });

  // Fetch stylists
  const { data: stylists = [], isLoading: isLoadingStylists } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });

  // If data is loading, show a spinner
  if (isLoadingAppointments || isLoadingStylists) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  // Transform appointments to events format that FullCalendar understands
  const events = appointments.map(appointment => {
    // Find the stylist for this appointment
    const stylist = stylists.find(s => s.id === appointment.stylistId);
    
    // Parse start and end times
    let startDate: Date;
    let endDateTime: Date;
    
    try {
      // Try to standardize the time format first
      const standardizedStartTime = appointment.startTime
        .replace(/(\d+)(am|pm)/i, '$1 $2')  // Fix "2pm" to "2 pm"
        .replace(/\s+/g, ' ');              // Normalize whitespace
        
      const standardizedEndTime = appointment.endTime
        ?.replace(/(\d+)(am|pm)/i, '$1 $2')
        ?.replace(/\s+/g, ' ');
      
      // Attempt to parse with standardized format
      startDate = new Date(`${appointment.date} ${standardizedStartTime}`);
      
      // If we have a valid end time, use it
      if (standardizedEndTime && !standardizedEndTime.includes('NaN')) {
        endDateTime = new Date(`${appointment.date} ${standardizedEndTime}`);
      } else {
        // Otherwise calculate from duration
        endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
      }
      
      // Final validity check
      if (isNaN(startDate.getTime())) {
        // Fall back to a default time (noon)
        startDate = new Date(`${appointment.date} 12:00 pm`);
        endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
      }
    } catch (error) {
      // If all parsing attempts fail, use default
      startDate = new Date(`${appointment.date} 12:00 pm`);
      endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
    }

    // Get a color for the stylist
    const getStylistColor = (id: number) => {
      const colors = [
        'rgba(212, 183, 142, 0.8)', // primary gold
        'rgba(139, 115, 74, 0.8)',  // darker gold
        'rgba(64, 134, 168, 0.8)',  // blue
        'rgba(123, 104, 238, 0.8)', // purple
        'rgba(75, 192, 192, 0.8)',  // teal
        'rgba(255, 159, 64, 0.8)',  // orange
      ];
      return colors[id % colors.length];
    };
    
    // Create the event
    return {
      id: String(appointment.id),
      title: `${stylist?.name || 'Stylist'}: ${appointment.customerName}\n${appointment.serviceName}`,
      start: startDate,
      end: endDateTime,
      backgroundColor: getStylistColor(appointment.stylistId),
      extendedProps: {
        stylistId: appointment.stylistId,
        stylistName: stylist?.name || 'Unknown Stylist',
        serviceName: appointment.serviceName,
        customerName: appointment.customerName,
        appointment: appointment
      }
    };
  });
  
  // Filter out any events with invalid dates
  const validEvents = events.filter(event => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
  
  const handleEventClick = (info: any) => {
    if (onAppointmentClick) {
      const appointmentData = info.event.extendedProps.appointment;
      onAppointmentClick(appointmentData);
    } else {
      // Default behavior if no click handler is provided
      const appointmentData = info.event.extendedProps.appointment;
      alert(`Appointment: ${appointmentData.customerName} - ${appointmentData.serviceName}`);
    }
  };
  
  return (
    <div className="h-full bg-white rounded-md shadow-sm p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridDay"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        events={validEvents}
        eventClick={handleEventClick}
        editable={true}
        selectable={true}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
          meridiem: 'short'
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short'
        }}
        height="700px" // Fixed height
        allDaySlot={false}
        nowIndicator={true}
      />
    </div>
  );
};

export default FullCalendarComponent;