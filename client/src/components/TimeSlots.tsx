import { format, parse } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { TimeSlot, Stylist, Appointment } from '@/lib/types';
import AppointmentComponent from '@/components/Appointment';

interface TimeSlotsProps {
  timeSlots: TimeSlot[];
  stylists: Stylist[];
  appointments: Appointment[];
  onTimeSlotClick: (stylistId: number, time: string) => void;
}

export default function TimeSlots({ 
  timeSlots, 
  stylists, 
  appointments,
  onTimeSlotClick 
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
  
  return (
    <div className="relative">
      {timeSlots.map((slot) => (
        <div key={slot.time} className="flex time-slot">
          <div className="w-16 flex-shrink-0 border-r border-border text-right pr-2 text-xs text-muted-foreground py-1">
            <div className="h-full flex flex-col justify-between">
              <span>{slot.formatted}</span>
              <span>15</span>
              <span>30</span>
              <span>45</span>
            </div>
          </div>
          
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
                className={`stylist-column flex-shrink-0 border-r border-border relative w-32 h-12 ${
                  !isOff ? 'cursor-pointer hover:bg-primary/10' : ''
                } ${isOver ? 'bg-primary/20' : ''}`}
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
      ))}
    </div>
  );
}
