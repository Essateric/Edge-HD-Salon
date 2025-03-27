import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  DndContext, 
  DragEndEvent, 
  closestCenter,
  pointerWithin,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import CalendarToolbar from '@/components/CalendarToolbar';
import ServicesPanel from '@/components/ServicesPanel';
import StylistHeader from '@/components/StylistHeader';
import TimeSlots from '@/components/TimeSlots';
import BottomToolbar from '@/components/BottomToolbar';
import BookingModal from '@/components/BookingModal';
import { useToast } from '@/hooks/use-toast';
import { Stylist, Appointment, Service, TimeSlot, ViewMode } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [showServices, setShowServices] = useState(false);
  const { toast } = useToast();
  
  const formattedDate = format(currentDate, "h:mma d MMMM yyyy");
  
  // Fetch stylists
  const { data: stylists = [] } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });
  
  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services']
  });
  
  // Fetch appointments for the current date
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await apiRequest(`/api/appointments?date=${format(currentDate, 'yyyy-MM-dd')}`, 'GET');
      return await res.json();
    }
  });
  
  // Generate time slots from 9am to 7pm
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour <= 19; hour++) {
    const isHour12 = hour % 12 === 0 ? 12 : hour % 12;
    const amPm = hour >= 12 ? 'pm' : 'am';
    
    timeSlots.push({
      time: `${hour}:00`,
      hour,
      minute: 0,
      formatted: `${isHour12}:00 ${amPm}`
    });
  }
  
  const handlePreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };
  
  const handleNewBooking = (stylistId?: number, time?: string) => {
    if (stylistId) {
      const stylist = stylists.find(s => s.id === stylistId) || null;
      setSelectedStylist(stylist);
    }
    
    if (time) {
      setSelectedTimeSlot(time);
    }
    
    setIsBookingModalOpen(true);
  };
  
  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (updatedAppointment: Partial<Appointment>) => {
      const res = await apiRequest(`/api/appointments/${updatedAppointment.id}`, 'PUT', updatedAppointment);
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')] });
      
      // Show success toast
      toast({
        title: "Appointment moved",
        description: "The appointment has been successfully reassigned.",
        variant: "default",
      });
    },
    onError: (error) => {
      // Show error toast
      toast({
        title: "Failed to move appointment",
        description: "There was an error while updating the appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper function to check for appointment time overlaps
  const hasTimeOverlap = (appointment: Appointment, targetStylistId: number) => {
    // Get all appointments for the target stylist
    const stylistAppointments = appointments.filter(a => 
      a.stylistId === targetStylistId && 
      a.id !== appointment.id
    );
    
    // Convert appointment times to comparable values (in minutes since midnight)
    const getTimeInMinutes = (timeStr: string) => {
      const [hours, minutes] = timeStr.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [0, 0];
      let totalMinutes = hours * 60 + minutes;
      
      // Adjust for PM times if in 12-hour format
      if (timeStr.toLowerCase().includes('pm') && hours < 12) {
        totalMinutes += 12 * 60;
      }
      
      return totalMinutes;
    };
    
    const appointmentStart = getTimeInMinutes(appointment.startTime);
    const appointmentEnd = getTimeInMinutes(appointment.endTime);
    
    // Check for overlap with any existing appointment
    return stylistAppointments.some(existingAppt => {
      const existingStart = getTimeInMinutes(existingAppt.startTime);
      const existingEnd = getTimeInMinutes(existingAppt.endTime);
      
      // Check if there's any overlap
      return (
        (appointmentStart < existingEnd && appointmentEnd > existingStart) ||
        (existingStart < appointmentEnd && existingEnd > appointmentStart)
      );
    });
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Extract data from the active element (dragged appointment)
    const appointment = (active.data.current as Appointment);
    
    // Extract data from the over element (drop target)
    const targetId = over.id.toString();
    const match = targetId.match(/slot-(\d+)-(\d+)/);
    
    if (match) {
      const stylistId = parseInt(match[1]);
      
      // Only update if the stylist has changed
      if (stylistId !== appointment.stylistId) {
        // Check for time overlaps before allowing the drop
        if (hasTimeOverlap(appointment, stylistId)) {
          // If there's an overlap, show a toast message and don't allow the drop
          toast({
            title: "Time slot conflict",
            description: "This appointment would overlap with an existing booking. Please choose another time slot.",
            variant: "destructive",
          });
          return;
        }
        
        // Update the appointment with new stylist if no overlap
        updateAppointmentMutation.mutate({
          id: appointment.id,
          stylistId
        });
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <CalendarToolbar 
        currentDate={formattedDate}
        viewMode={viewMode}
        onPrevious={handlePreviousDay}
        onNext={handleNextDay}
        onViewModeChange={setViewMode}
        onNewBooking={() => handleNewBooking()}
      />
      
      <DndContext 
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="flex flex-grow overflow-hidden h-[calc(100vh-130px)]">
          {/* Main calendar grid */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="min-w-max">
              <StylistHeader stylists={stylists} />
              
              <TimeSlots 
                timeSlots={timeSlots}
                stylists={stylists}
                appointments={appointments}
                onTimeSlotClick={handleNewBooking}
              />
            </div>
          </div>
        </div>
      </DndContext>
      
      <BottomToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        stylists={stylists}
        services={services}
        selectedDate={currentDate}
        selectedTimeSlot={selectedTimeSlot}
        selectedStylist={selectedStylist}
      />
    </div>
  );
}
