import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Import our custom CSS for FullCalendar
import '@/styles/fullcalendar.css';

const SimpleCalendar: React.FC = () => {
  const events = [
    { title: 'Haircut with Martin', date: '2025-04-10', start: '10:00', end: '11:00' },
    { title: 'Color with Darren', date: '2025-04-10', start: '14:00', end: '16:00' },
    { title: 'Styling with Annaliese', date: '2025-04-11', start: '09:30', end: '10:30' },
  ];
  
  return (
    <div className="h-full">
      <FullCalendar
        plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
        initialView="timeGridDay"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={true}
        selectable={true}
        eventClick={(info) => {
          alert(`Appointment: ${info.event.title}`);
        }}
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:15:00"
        slotLabelInterval="00:15:00"
        snapDuration="00:15:00"
        height="calc(100vh - 200px)"
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
      />
    </div>
  );
};

export default SimpleCalendar;