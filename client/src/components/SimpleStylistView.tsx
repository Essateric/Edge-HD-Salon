import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Loader2 } from 'lucide-react';
import '@/styles/fullcalendar.css';

// FullCalendar event types
import { EventClickArg, DatesSetArg } from '@fullcalendar/core';

interface SimpleStylistViewProps {
  onAppointmentClick?: (appointment: any) => void;
}

const SimpleStylistView: React.FC<SimpleStylistViewProps> = ({ 
  onAppointmentClick
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Hard-coded resources for simplicity
  const resources = [
    { id: '1', title: 'Martin' },
    { id: '2', title: 'Darren' },
    { id: '3', title: 'Annaliese' }
  ];
  
  // Hard-coded events for demonstration
  const events = [
    {
      id: '1',
      resourceId: '1',
      title: 'Jane Smith - Cut & Blow Dry',
      start: '2025-04-10T10:00:00',
      end: '2025-04-10T11:00:00',
      backgroundColor: 'rgba(212, 183, 142, 0.9)',
      extendedProps: {
        appointment: {
          customerName: 'Jane Smith',
          serviceName: 'Cut & Blow Dry'
        }
      }
    },
    {
      id: '2',
      resourceId: '2',
      title: 'John Doe - Beard Trim',
      start: '2025-04-10T11:15:00',
      end: '2025-04-10T11:45:00',
      backgroundColor: 'rgba(139, 115, 74, 0.9)',
      extendedProps: {
        appointment: {
          customerName: 'John Doe',
          serviceName: 'Beard Trim'
        }
      }
    },
    {
      id: '3',
      resourceId: '3',
      title: 'Alice Johnson - Full Colour',
      start: '2025-04-10T14:00:00',
      end: '2025-04-10T16:00:00',
      backgroundColor: 'rgba(164, 132, 85, 0.9)',
      extendedProps: {
        appointment: {
          customerName: 'Alice Johnson',
          serviceName: 'Full Colour'
        }
      }
    }
  ];

  const handleEventClick = (info: EventClickArg) => {
    if (onAppointmentClick) {
      const appointmentData = info.event.extendedProps.appointment;
      onAppointmentClick(appointmentData);
    }
  };

  const handleDateSet = (dateInfo: DatesSetArg) => {
    setCurrentDate(dateInfo.view.currentStart);
  };
  
  // Force a refresh when date changes
  const [calendarKey, setCalendarKey] = useState(Date.now());

  useEffect(() => {
    const today = new Date();
    // Update events to today's date
    events.forEach(event => {
      const eventDate = new Date(event.start);
      eventDate.setFullYear(today.getFullYear());
      eventDate.setMonth(today.getMonth());
      eventDate.setDate(today.getDate());
      
      const endDate = new Date(event.end);
      endDate.setFullYear(today.getFullYear());
      endDate.setMonth(today.getMonth());
      endDate.setDate(today.getDate());
      
      event.start = eventDate.toISOString();
      event.end = endDate.toISOString();
    });
    
    setCalendarKey(Date.now());
  }, []);
  
  // Add inline CSS
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .fc-col-header-cell .fc-scrollgrid-sync-inner {
        width: 100%;
      }
      .resource-column {
        width: 33.33% !important;
        float: left !important;
      }
      .fc-resource-timeline-divider, .fc-resource-timegrid-divider {
        display: none !important;
      }
      .fc .fc-datagrid-cell {
        width: 33.33% !important;
        min-width: 150px !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    }
  }, []);

  return (
    <div className="h-full bg-white rounded-md shadow-sm p-4 border border-muted overflow-x-auto">
      <FullCalendar
        key={calendarKey}
        plugins={[resourceTimeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="resourceTimeGridDay"
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        views={{
          resourceTimeGridDay: {
            type: 'resourceTimeGrid',
            duration: { days: 1 }
          },
          resourceTimeGridWeek: {
            type: 'resourceTimeGrid',
            duration: { days: 7 }
          }
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'resourceTimeGridDay,resourceTimeGridWeek'
        }}
        resources={resources}
        events={events}
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        slotLabelInterval="00:15:00"
        snapDuration="00:15:00"
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
        height="auto"
        allDaySlot={false}
        nowIndicator={true}
        resourceLabelDidMount={(info: any) => {
          info.el.classList.add('stylist-column-header');
          info.el.parentElement.classList.add('resource-column');
        }}
      />
    </div>
  );
};

export default SimpleStylistView;