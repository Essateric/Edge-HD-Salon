import { format, parse, startOfWeek, addDays } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { TimeSlot, Stylist, Appointment, ViewMode } from '@/lib/types';
import AppointmentComponent from '@/components/Appointment';

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
}: TimeSlotsProps) {
  // Function to get appointments for a specific time slot and stylist
  const getAppointmentsForTimeSlot = (time: string, stylistId: number) => {
    return appointments.filter(appointment => {
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
  
  // Calculate column width based on number of stylists
  const getColumnWidth = () => {
    // Base width is 120px for 1-4 stylists
    // For more stylists, we'll reduce the width proportionally
    const baseWidth = 120;
    const minWidth = 90; // Minimum width for narrow screens
    
    // On smaller screens, we'll use a smaller size
    const isMobile = window.innerWidth < 768;
    const defaultWidth = isMobile ? minWidth : baseWidth;
    
    return `${defaultWidth}px`;
  };
  
  // Day view - the default
  const renderDayView = () => (
    <div className="relative flex flex-col h-full">
      {timeSlots.map((slot) => (
        <div key={slot.time} className="flex time-slot" style={{ minHeight: '48px' }}>
          <div className="w-16 md:w-20 flex-shrink-0 border-r border-border text-right pr-2 text-xs text-muted-foreground py-1">
            <div className="h-full flex flex-col justify-between">
              <span>{slot.formatted}</span>
              <span className="hidden md:block">15</span>
              <span>30</span>
              <span className="hidden md:block">45</span>
            </div>
          </div>
          
          <div className="flex flex-grow overflow-x-auto">
            {stylists.map((stylist) => {
              const timeSlotAppointments = getAppointmentsForTimeSlot(slot.time, stylist.id);
              const isOff = isTimeSlotOff(slot.time, stylist.id);
              
              // Create a droppable area for each stylist column
              const { isOver, setNodeRef } = useDroppable({
                id: `slot-${stylist.id}-${slot.time}`,
                data: {
                  stylistId: stylist.id,
                  time: slot.time
                }
              });
              
              return (
                <div 
                  ref={setNodeRef}
                  key={`${slot.time}-${stylist.id}`} 
                  className={`stylist-column relative h-12 border-r border-border ${
                    !isOff ? 'cursor-pointer hover:bg-primary/10' : ''
                  } ${isOver ? 'bg-primary/20' : ''}`}
                  style={{ width: getColumnWidth() }}
                  onClick={() => !isOff && onTimeSlotClick(stylist.id, slot.formatted)}
                >
                  {isOff ? (
                    <div className="h-full bg-muted text-center text-xs text-muted-foreground pt-2">off</div>
                  ) : (
                    timeSlotAppointments.length > 0 ? (
                      <div className="relative">
                        {timeSlotAppointments.map((appointment, index) => {
                          // Calculate top position based on start time
                          const startTime = appointment.startTime;
                          let topPosition = 0;
                          
                          try {
                            // Parse 12-hour time (e.g., "1:00 pm")
                            const match12Hr = /(\d+):(\d+)\s*(am|pm)/i;
                            const startMatch = startTime.match(match12Hr);
                            
                            if (startMatch) {
                              let startHour = parseInt(startMatch[1]);
                              const startMinute = parseInt(startMatch[2]);
                              const startPeriod = startMatch[3].toLowerCase();
                              
                              // Convert to 24-hour
                              if (startPeriod === 'pm' && startHour < 12) startHour += 12;
                              if (startPeriod === 'am' && startHour === 12) startHour = 0;
                              
                              // Calculate top position relative to the time slot
                              const slotHour = parseInt(slot.time.split(':')[0]);
                              const slotMinute = parseInt(slot.time.split(':')[1]);
                              
                              // If the appointment starts before this time slot
                              if (startHour < slotHour || (startHour === slotHour && startMinute < slotMinute)) {
                                topPosition = 0;
                              } else {
                                // Calculate minutes from the start of the time slot
                                const minutesFromSlotStart = 
                                  (startHour - slotHour) * 60 + (startMinute - slotMinute);
                                
                                // Each 15 minutes is 12px in height
                                topPosition = (minutesFromSlotStart * 12) / 15;
                              }
                            } else {
                              // Try 24-hour format as fallback
                              const match24Hr = /(\d+):(\d+)/;
                              const startMatch = startTime.match(match24Hr);
                              
                              if (startMatch) {
                                const startHour = parseInt(startMatch[1]);
                                const startMinute = parseInt(startMatch[2]);
                                
                                // Calculate top position
                                const slotHour = parseInt(slot.time.split(':')[0]);
                                const slotMinute = parseInt(slot.time.split(':')[1]);
                                
                                if (startHour < slotHour || (startHour === slotHour && startMinute < slotMinute)) {
                                  topPosition = 0;
                                } else {
                                  const minutesFromSlotStart = 
                                    (startHour - slotHour) * 60 + (startMinute - slotMinute);
                                  topPosition = (minutesFromSlotStart * 12) / 15;
                                }
                              }
                            }
                          } catch (e) {
                            console.error("Failed to calculate appointment position", e);
                          }
                          
                          return (
                            <div 
                              key={appointment.id}
                              className="absolute"
                              style={{
                                // Top position is calculated based on start time relative to the time slot
                                top: `${topPosition}px`,
                                // Add horizontal offset for overlapping appointments (simple approach)
                                left: index % 2 === 0 ? '0%' : '2%', 
                                width: index % 2 === 0 ? '98%' : '98%',
                                zIndex: 10 + index
                              }}
                            >
                              <AppointmentComponent 
                                appointment={appointment}
                                onEditAppointment={onEditAppointment}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="text-xs text-muted-foreground border border-dashed border-muted-foreground rounded-sm w-3/4 h-3/4 flex items-center justify-center">
                          <span>+</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
  } else {
    return renderDayView();
  }
}
