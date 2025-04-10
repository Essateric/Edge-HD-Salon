import { format, parse, startOfWeek, addDays } from 'date-fns';
import { TimeSlot, Stylist, Appointment, ViewMode } from '@/lib/types';
import AppointmentComponent from '@/components/Appointment';
import DroppableArea from '@/components/DroppableArea';
import TimeSidebar from '@/components/TimeSidebar';
import { useEffect, useState } from 'react';

interface TimeSlotsProps {
  timeSlots: TimeSlot[];
  stylists: Stylist[];
  appointments: Appointment[];
  onTimeSlotClick: (stylistId: number, time: string) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  viewMode?: ViewMode;
}

export default function TimeSlots({ 
  timeSlots, 
  stylists, 
  appointments,
  onTimeSlotClick,
  onEditAppointment,
  viewMode = 'day'
}: TimeSlotsProps): JSX.Element {
  // Function to get appointments for a specific time slot and stylist
  const getAppointmentsForTimeSlot = (time: string, stylistId: number) => {
    // Create a deep copy of appointments to avoid reference issues
    let allAppointments = [...appointments];
    
    // Add the last moved appointment if it exists and isn't already in the list
    // This is a critical backup system for when appointments temporarily disappear from state
    if (window.lastMovedAppointment && 
        !appointments.some(a => a.id === window.lastMovedAppointment?.id)) {
      console.log("Using backup appointment from global state:", window.lastMovedAppointment);
      allAppointments.push(window.lastMovedAppointment);
    }
    
    return allAppointments.filter(appointment => {
      if (appointment.stylistId !== stylistId) return false;
      
      const startTime = appointment.startTime;
      const endTime = appointment.endTime;
      
      // Convert time formats to comparable values
      const slotTime = parse(time, 'H:mm', new Date()).getTime();
      let apptStartTime, apptEndTime;
      
      try {
        // Handle 12-hour format (e.g., "1:00 pm")
        apptStartTime = parse(startTime, 'h:mm a', new Date()).getTime();
        apptEndTime = parse(endTime, 'h:mm a', new Date()).getTime();
      } catch (e) {
        // Fallback for 24-hour format (e.g., "13:00")
        try {
          apptStartTime = parse(startTime, 'H:mm', new Date()).getTime();
          apptEndTime = parse(endTime, 'H:mm', new Date()).getTime();
        } catch (e2) {
          console.error("Failed to parse appointment time", startTime, endTime);
          return false;
        }
      }
      
      return appointment.stylistId === stylistId && 
             slotTime >= apptStartTime && 
             slotTime < apptEndTime;
    });
  };
  
  // Check if a time slot is "off" (outside working hours)
  const isTimeSlotOff = (time: string, stylistId: number) => {
    const hour = parseInt(time.split(':')[0]);
    // For this example, all stylists work from 10am to 7pm
    return hour < 10;
  };
  
  // Each column should have a fixed minimum width to match StylistHeader
  const minColumnWidth = '200px';

  // Adding 15-minute gridlines to each time slot
  const TimeSlotGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
      <div className="border-b border-dashed border-border/20"></div>
      <div className="border-b border-dashed border-border/20"></div>
      <div className="border-b border-dashed border-border/20"></div>
      <div></div>
    </div>
  );
  
  // Constants
  const APPOINTMENT_HEIGHT = 21.1875; // height per 15 min
  
  // Function to convert time to top offset
  const timeToOffset = (time: string): number => {
    // Handle 12-hour format
    let hours = 0;
    let minutes = 0;
    
    const match12Hr = /(\d+):(\d+)\s*(am|pm)/i;
    const match12Result = time.match(match12Hr);
    
    if (match12Result) {
      hours = parseInt(match12Result[1]);
      minutes = parseInt(match12Result[2]);
      const period = match12Result[3].toLowerCase();
      
      // Convert to 24-hour
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
    } else {
      // Try 24-hour format as fallback
      const match24Hr = /(\d+):(\d+)/;
      const match24Result = time.match(match24Hr);
      
      if (match24Result) {
        hours = parseInt(match24Result[1]);
        minutes = parseInt(match24Result[2]);
      }
    }
    
    const totalMinutes = (hours - 9) * 60 + minutes; // 9am is start time (offset 0)
    return (totalMinutes / 15) * APPOINTMENT_HEIGHT;
  };
  
  // Function to calculate appointment height based on duration
  const durationToHeight = (start: string, end: string): number => {
    // Convert to 24-hour format if needed
    let startHours = 0, startMinutes = 0, endHours = 0, endMinutes = 0;
    
    // Process start time
    const startMatch12Hr = start.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (startMatch12Hr) {
      startHours = parseInt(startMatch12Hr[1]);
      startMinutes = parseInt(startMatch12Hr[2]);
      const startPeriod = startMatch12Hr[3].toLowerCase();
      
      if (startPeriod === 'pm' && startHours < 12) startHours += 12;
      if (startPeriod === 'am' && startHours === 12) startHours = 0;
    } else {
      const startMatch24Hr = start.match(/(\d+):(\d+)/);
      if (startMatch24Hr) {
        startHours = parseInt(startMatch24Hr[1]);
        startMinutes = parseInt(startMatch24Hr[2]);
      }
    }
    
    // Process end time
    const endMatch12Hr = end.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (endMatch12Hr) {
      endHours = parseInt(endMatch12Hr[1]);
      endMinutes = parseInt(endMatch12Hr[2]);
      const endPeriod = endMatch12Hr[3].toLowerCase();
      
      if (endPeriod === 'pm' && endHours < 12) endHours += 12;
      if (endPeriod === 'am' && endHours === 12) endHours = 0;
    } else {
      const endMatch24Hr = end.match(/(\d+):(\d+)/);
      if (endMatch24Hr) {
        endHours = parseInt(endMatch24Hr[1]);
        endMinutes = parseInt(endMatch24Hr[2]);
      }
    }
    
    const durationInMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return (durationInMinutes / 15) * APPOINTMENT_HEIGHT;
  };
  
  // Render a column for each stylist with their appointments
  const renderStylistColumn = (stylist: Stylist) => {
    // Filter appointments for this stylist only
    const stylistAppointments = appointments.filter(appointment => 
      appointment.stylistId === stylist.id
    );
    
    return (
      <div 
        key={`stylist-column-${stylist.id}`} 
        className="flex-1 border-r relative"
        style={{ minWidth: minColumnWidth }}
      >
        {/* Keeping an empty div for spacing - removing the text */}
        <div className="sticky top-0 z-10"></div>
        
        {/* Main droppable column for this stylist */}
        <DroppableArea
          droppableId={`stylist-${stylist.id}`}
          direction="vertical"
        >
          {(provided, snapshot) => {
            // Make sure to return a proper div element, not a fragment
            return (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="h-full w-full absolute"
              >
                {/* Appointments */}
                {stylistAppointments.map((appointment, index) => (
                  <div 
                    key={`appointment-wrapper-${appointment.id}`}
                    style={{
                      position: 'absolute',
                      top: `${timeToOffset(appointment.startTime)}px`,
                      width: '100%',
                      height: `${durationToHeight(appointment.startTime, appointment.endTime)}px`,
                      zIndex: 20 + index
                    }}
                  >
                    <AppointmentComponent 
                      appointment={appointment}
                      onEditAppointment={onEditAppointment}
                      index={index} 
                    />
                  </div>
                ))}
                {provided.placeholder}
              </div>
            );
          }}
        </DroppableArea>
        
        {/* Time slot grid lines without droppables to avoid nesting issues */}
        {timeSlots.map(slot => (
          <div
            key={`time-slot-${stylist.id}-${slot.time}`}
            className="time-slot border-b border-gray-200 cursor-pointer hover:bg-primary/5 relative"
            style={{
              height: `${APPOINTMENT_HEIGHT}px`, 
              position: 'absolute',
              width: '100%',
              top: `${timeToOffset(slot.time)}px`,
              zIndex: 10 // Below appointment elements
            }}
            data-slot-id={`stylist-${stylist.id}-slot-${slot.formatted}`}
            onClick={() => onTimeSlotClick(stylist.id, slot.formatted)}
          >
            {/* Small time label at the left edge of each time slot */}
            {slot.time.endsWith(':00') && (
              <div className="text-xs text-gray-500 absolute left-2 top-0 pt-0.5">
                {slot.formatted}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Current time indicator
  const [nowPosition, setNowPosition] = useState(0);
  
  // Update the current time indicator position
  useEffect(() => {
    const pixelsPerMinute = 1.4125;
    const startHour = 9; // Calendar starts at 9:00 AM

    function updateNowLine() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;

      const topPosition = minutesSinceStart * pixelsPerMinute;
      setNowPosition(topPosition);
    }

    updateNowLine();
    const interval = setInterval(updateNowLine, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Day view - the default
  const renderDayView = () => (
    <div className="relative h-full">
      <div id="calendar-wrapper" className="flex">
        {/* Time Sidebar */}
        <TimeSidebar startHour={9} endHour={20} />
        
        {/* Main Calendar Content - new layout with vertical columns */}
        <div className="flex flex-1 relative non-scrollable-container" style={{ height: 'calc(100vh - 200px)', overflowX: 'auto', overflowY: 'hidden' }}>
          {/* Current time line indicator */}
          <div
            id="now-line"
            className="absolute left-0 w-full border-t-2 border-red-500 z-50"
            style={{ top: `${nowPosition}px` }}
          ></div>
          
          {stylists.map(stylist => renderStylistColumn(stylist))}
        </div>
      </div>
    </div>
  );
  
  // Week view - for now, same as day view but with a message
  const renderWeekView = () => (
    <div className="relative flex flex-col h-full">
      <div className="mb-2 p-1 bg-gradient-to-r from-[#D4B78E]/10 to-[#8B734A]/10 rounded text-sm text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-medium">Week View</span>
      </div>
      <div className="flex-grow h-full">
        {renderDayView()}
      </div>
    </div>
  );
  
  // Render view based on viewMode
  if (viewMode === 'week') {
    return renderWeekView();
  }
  
  return renderDayView();
}