import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Appointment, Stylist } from '@/lib/types';

// Import our custom CSS for FullCalendar
import '@/styles/fullcalendar.css';

interface FullCalendarViewProps {
  appointments: Appointment[];
  stylists: Stylist[];
  onEditAppointment?: (appointment: Appointment) => void;
}

export default function FullCalendarView({ 
  appointments, 
  stylists, 
  onEditAppointment 
}: FullCalendarViewProps) {
  // Transform appointments to events format that FullCalendar understands
  const events = appointments.map(appointment => {
    // Find the stylist for this appointment
    const stylist = stylists.find(s => s.id === appointment.stylistId);
    
    // Parse start and end times if they're valid
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
        console.log('Using default time for appointment:', appointment.id);
        startDate = new Date(`${appointment.date} 12:00 pm`);
        endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
      }
    } catch (error) {
      // If all parsing attempts fail, use default
      console.log('Time parsing failed completely for appointment:', appointment.id);
      startDate = new Date(`${appointment.date} 12:00 pm`);
      endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
    }
    
    // Create the event with properly formatted title for better display
    return {
      id: String(appointment.id),
      title: `${stylist?.name || 'Stylist'}: ${appointment.customerName}\n${appointment.serviceName}`,
      start: startDate,
      end: endDateTime,
      extendedProps: {
        stylistId: appointment.stylistId,
        stylistName: stylist?.name || 'Unknown Stylist',
        serviceName: appointment.serviceName,
        customerName: appointment.customerName,
        appointment: appointment
      },
      backgroundColor: stylist ? 
        `rgba(${Math.floor(stylist.id * 30 % 256)}, ${Math.floor(stylist.id * 50 % 256)}, ${Math.floor(stylist.id * 70 % 256)}, 0.8)` : 
        '#3788d8'
    };
  });
  
  // Filter out any events with invalid dates (should be unnecessary with our improved parsing)
  const validEvents = events.filter(event => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
  
  const handleEventClick = (info: any) => {
    if (onEditAppointment) {
      const appointmentData = info.event.extendedProps.appointment;
      onEditAppointment(appointmentData);
    } else {
      alert(`Appointment: ${info.event.title}`);
    }
  };
  
  return (
    <div className="h-full w-full">
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
        height="calc(100vh - 200px)"
      />
    </div>
  );
}