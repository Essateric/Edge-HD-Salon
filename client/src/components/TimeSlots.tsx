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
      const startTime = appointment.startTime;
      const endTime = appointment.endTime;
      
      // Convert time formats to comparable values
      const slotTime = parse(time, 'H:mm', new Date()).getTime();
      const apptStartTime = parse(startTime, 'h:mm a', new Date()).getTime();
      const apptEndTime = parse(endTime, 'h:mm a', new Date()).getTime();
      
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
    <div className="relative">
      {timeSlots.map((slot) => (
        <div key={slot.time} className="flex time-slot">
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
                      timeSlotAppointments.map((appointment) => (
                        <AppointmentComponent 
                          key={appointment.id} 
                          appointment={appointment}
                          onEditAppointment={onEditAppointment}
                        />
                      ))
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
    <div className="relative">
      <div className="mb-2 p-1 bg-gradient-to-r from-[#D4B78E]/10 to-[#8B734A]/10 rounded text-sm text-center">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-medium">Week View</span>
      </div>
      {renderDayView()}
    </div>
  );
  
  // Render view based on viewMode
  if (viewMode === 'week') {
    return renderWeekView();
  } else {
    return renderDayView();
  }
}
