import { format, parse, startOfWeek, addDays } from 'date-fns';
import { TimeSlot, Stylist, Appointment, ViewMode } from '@/lib/types';
import AppointmentComponent from '@/components/Appointment';
import DroppableArea from '@/components/DroppableArea';

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
    // Equal width for all columns
    return `calc((100% - 20px) / ${stylists.length})`;
  };

  // Adding 15-minute gridlines to each time slot
  const TimeSlotGrid = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
      <div className="border-b border-dashed border-border/20"></div>
      <div className="border-b border-dashed border-border/20"></div>
      <div className="border-b border-dashed border-border/20"></div>
      <div></div>
    </div>
  );
  
  // Day view - the default
  const renderDayView = () => (
    <div className="relative flex flex-col h-full">
      {timeSlots.map((slot) => (
        <div key={slot.time} className="flex time-slot" style={{ minHeight: '120px' }}>
          <div className="w-20 md:w-28 flex-shrink-0 border-r border-border text-right pr-2 text-sm text-muted-foreground py-2 bg-background sticky left-0">
            <div className="h-full flex flex-col justify-between">
              <div className="font-medium flex justify-end items-center gap-1">
                {slot.formatted}
                <div className="w-3 h-0.5 bg-muted-foreground/50"></div>
              </div>
              <div className="flex justify-end items-center gap-1">
                <span className="text-xs">15</span>
                <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
              </div>
              <div className="flex justify-end items-center gap-1">
                <span className="text-xs">30</span>
                <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
              </div>
              <div className="flex justify-end items-center gap-1">
                <span className="text-xs">45</span>
                <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-grow">
            {stylists.map((stylist) => {
              const timeSlotAppointments = getAppointmentsForTimeSlot(slot.time, stylist.id);
              const isOff = isTimeSlotOff(slot.time, stylist.id);
              
              return (
                <DroppableArea 
                  droppableId={`stylist-${stylist.id}-slot-${slot.time}`}
                  key={`${slot.time}-${stylist.id}`}
                  isDropDisabled={isOff}
                  direction="vertical"
                >
                  {(provided, snapshot) => {
                    return (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`stylist-column relative h-[120px] border-r border-b border-border ${
                          !isOff ? 'cursor-pointer hover:bg-primary/10' : ''
                        } ${snapshot.isDraggingOver ? 'bg-primary/20' : ''}`}
                        style={{ width: getColumnWidth() }}
                        onClick={() => !isOff && onTimeSlotClick(stylist.id, slot.formatted)}
                      >
                        {/* 15-minute grid lines */}
                        {!isOff && <TimeSlotGrid>{null}</TimeSlotGrid>}
                        
                        {isOff ? (
                          <div className="h-full bg-muted text-center text-sm text-muted-foreground pt-2 font-medium">
                            off
                          </div>
                        ) : (
                          <>
                            {/* Appointments */}
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
                                    
                                    // Each 15 minutes is 30px in height (120px / 4 = 30px per 15 min)
                                    topPosition = (minutesFromSlotStart * 30) / 15;
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
                                      // Each 15 minutes is 30px in height (120px / 4 = 30px per 15 min)
                                      topPosition = (minutesFromSlotStart * 30) / 15;
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
                                    left: '2%', 
                                    width: '96%',
                                    zIndex: 20 + index
                                  }}
                                >
                                  <AppointmentComponent 
                                    appointment={appointment}
                                    onEditAppointment={onEditAppointment}
                                    index={index}
                                  />
                                </div>
                              );
                            })}
                            
                            {/* Empty state */}
                            {timeSlotAppointments.length === 0 && (
                              <div className="h-full w-full flex items-center justify-center">
                                <div className="text-sm text-muted-foreground border-2 border-dashed border-muted-foreground/50 rounded-md w-5/6 h-5/6 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                  <span className="font-medium">+</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Placeholder for dragging - essential for react-beautiful-dnd to work correctly */}
                            {provided.placeholder}
                          </>
                        )}
                      </div>
                    );
                  }}
                </DroppableArea>
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
  }
  
  return renderDayView();
}