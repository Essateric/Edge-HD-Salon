import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Appointment, Stylist } from '@/lib/types';
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
    let startDate = new Date(`${appointment.date} ${appointment.startTime}`);
    let endDateTime = new Date(`${appointment.date} ${appointment.endTime}`);
    
    // If parsing fails, calculate based on duration
    if (isNaN(startDate.getTime()) || isNaN(endDateTime.getTime())) {
      // If startTime is invalid, set default to noon
      if (isNaN(startDate.getTime())) {
        startDate = new Date(`${appointment.date} 12:00 pm`);
      }
      
      // Use duration to calculate end time
      if (isNaN(endDateTime.getTime())) {
        endDateTime = new Date(startDate.getTime() + ((appointment.duration || 30) * 60000));
      }
    }
    
    // Create the event
    return {
      id: String(appointment.id),
      title: `${stylist?.name || 'Stylist'}: ${appointment.customerName} - ${appointment.serviceName}`,
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
  
  // Filter out any events with invalid dates
  const validEvents = events.filter(event => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
  
  const handleEventClick = (info: any) => {
    if (onEditAppointment) {
      const appointmentData = info.event.extendedProps.appointment;
      onEditAppointment(appointmentData);
    }
  };
  
  return (
    <div className="h-full w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
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