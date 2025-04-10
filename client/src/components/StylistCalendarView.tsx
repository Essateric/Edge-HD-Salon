import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { Appointment, Stylist } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import '@/styles/fullcalendar.css';

// FullCalendar event types
import { EventClickArg, DatesSetArg } from '@fullcalendar/core';

interface StylistCalendarViewProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  selectedDate?: Date;
}

const StylistCalendarView: React.FC<StylistCalendarViewProps> = ({ 
  onAppointmentClick,
  selectedDate = new Date()
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  
  // Fetch all appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/appointments');
      return res.json();
    }
  });

  // Fetch stylists
  const { data: stylists = [], isLoading: isLoadingStylists } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/stylists');
      return res.json();
    }
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

  // Custom resource creation for stylists as columns
  const resources = stylists.map(stylist => ({
    id: String(stylist.id),
    title: stylist.name
  }));

  // Transform appointments to events format that FullCalendar understands
  const events = appointments.map(appointment => {
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

    // Get a color based on service - using the same colors as day-based calendar
    const getServiceColor = (serviceId: number) => {
      const colors = [
        'rgba(212, 183, 142, 0.9)', // primary gold
        'rgba(139, 115, 74, 0.9)',  // darker gold
        'rgba(164, 132, 85, 0.9)',  // medium gold
        'rgba(187, 156, 108, 0.9)', // light gold
        'rgba(130, 106, 67, 0.9)',  // deep gold
        'rgba(200, 173, 134, 0.9)', // soft gold
      ];
      return colors[serviceId % colors.length];
    };
    
    // Create the event with resource ID mapping to stylist
    return {
      id: String(appointment.id),
      resourceId: String(appointment.stylistId), // Connect to the stylist column
      title: `${appointment.customerName || 'Guest'} - ${appointment.serviceName}`,
      start: startDate,
      end: endDateTime,
      backgroundColor: getServiceColor(appointment.serviceId || 0),
      extendedProps: {
        appointment: appointment
      }
    };
  });
  
  // Filter out any events with invalid dates
  const validEvents = events.filter(event => 
    !isNaN(new Date(event.start).getTime()) && !isNaN(new Date(event.end).getTime())
  );
  
  const handleEventClick = (info: EventClickArg) => {
    if (onAppointmentClick) {
      const appointmentData = info.event.extendedProps.appointment;
      onAppointmentClick(appointmentData);
    }
  };

  const handleDateSet = (dateInfo: DatesSetArg) => {
    setCurrentDate(dateInfo.view.currentStart);
  };
  
  return (
    <div className="h-full bg-white rounded-md shadow-sm p-4 border border-muted">
      <FullCalendar
        plugins={[resourceTimeGridPlugin, resourceTimelinePlugin, dayGridPlugin, interactionPlugin]}
        initialView="resourceTimeGridDay"
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'resourceTimeGridDay,resourceTimelineDay'
        }}
        resources={resources}
        events={validEvents}
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        slotLabelInterval={{minutes: 15}}
        snapDuration={{minutes: 15}}
        eventClick={handleEventClick}
        datesSet={handleDateSet}
        initialDate={currentDate}
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
        displayEventTime={true}
        displayEventEnd={true}
        height="700px"
        allDaySlot={false}
        nowIndicator={true}
        resourceLabelDidMount={(info: any) => {
          // Add stylist name styling
          info.el.classList.add('stylist-column-header');
        }}
      />
    </div>
  );
};

export default StylistCalendarView;