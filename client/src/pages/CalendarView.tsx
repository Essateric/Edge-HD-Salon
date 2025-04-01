import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import CalendarToolbar from '@/components/CalendarToolbar';
import ServicesPanel from '@/components/ServicesPanel';
import StylistHeader from '@/components/StylistHeader';
import TimeSlots from '@/components/TimeSlots';
import BottomToolbar from '@/components/BottomToolbar';
import BookingModal from '@/components/BookingModal';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Stylist, Appointment, Service, TimeSlot, ViewMode } from '@/lib/types';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [showServices, setShowServices] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();
  
  // Format date based on view mode
  const getFormattedDate = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "EEEE, d MMMM yyyy");
      case 'week':
        const startOfWeek = addDays(currentDate, -currentDate.getDay());
        const endOfWeek = addDays(startOfWeek, 6);
        return `${format(startOfWeek, "d MMM")} - ${format(endOfWeek, "d MMM yyyy")}`;
      case 'month':
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "d MMMM yyyy");
    }
  };
  
  const formattedDate = getFormattedDate();
  
  // Fetch stylists
  const { data: fetchedStylists = [] } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });
  
  // Ensure stylists are in the correct order matching the screenshot
  const stylists = [...fetchedStylists].sort((a, b) => {
    // Define the order we want based on the screenshot
    const order = ["Martin", "Darren", "Annaliese", "Daisy", "Ryan", "Jasmine"];
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    
    // If a name is not in the order array, put it at the end
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    // Otherwise, sort by the index in the order array
    return aIndex - bIndex;
  });
  
  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services']
  });
  
  // Connect to WebSocket for real-time updates
  const { lastMessage, connected } = useWebSocket();
  
  // Fetch appointments for the current date
  const { data: appointments = [], refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await apiRequest(`/api/appointments?date=${format(currentDate, 'yyyy-MM-dd')}`, 'GET');
      return await res.json();
    }
  });
  
  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      console.log('Received WebSocket message:', lastMessage);
      
      // Handle different message types
      switch (lastMessage.type) {
        case 'appointment_created':
        case 'appointment_updated':
        case 'appointment_deleted':
          // Refresh appointments data
          refetchAppointments();
          
          // Show appropriate toast message
          if (lastMessage.type === 'appointment_created') {
            toast({
              title: "New appointment created",
              description: "Calendar has been updated with a new booking.",
              variant: "default",
            });
          } else if (lastMessage.type === 'appointment_updated') {
            toast({
              title: "Appointment updated",
              description: "An appointment has been modified.",
              variant: "default",
            });
          } else if (lastMessage.type === 'appointment_deleted') {
            toast({
              title: "Appointment removed",
              description: "An appointment has been cancelled.",
              variant: "default",
            });
          }
          break;
          
        case 'connection':
          console.log('Connected to WebSocket server');
          break;
          
        default:
          console.log('Unhandled WebSocket message type:', lastMessage.type);
      }
    }
  }, [lastMessage, refetchAppointments, toast]);
  
  // Show connection status indicator
  useEffect(() => {
    if (connected) {
      console.log('WebSocket connection established');
    } else {
      console.log('WebSocket disconnected');
    }
  }, [connected]);
  
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
  
  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subDays(currentDate, 7));
        break;
      case 'month':
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        setCurrentDate(prevMonth);
        break;
    }
  };
  
  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        setCurrentDate(nextMonth);
        break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleNewBooking = (stylistId?: number, time?: string) => {
    setEditingAppointment(null); // Clear any editing state
    
    if (stylistId) {
      const stylist = stylists.find(s => s.id === stylistId) || null;
      setSelectedStylist(stylist);
    }
    
    if (time) {
      setSelectedTimeSlot(time);
    }
    
    setIsBookingModalOpen(true);
  };
  
  // Handle appointment edit
  const handleEditAppointment = (appointment: Appointment) => {
    console.log("Editing appointment:", appointment);
    
    // Fetch the complete appointment details if needed
    if (!appointment.services || appointment.services.length === 0) {
      // If services are not available, we need to create a default one from the main service
      if (appointment.serviceId && appointment.serviceName) {
        const enrichedAppointment = {
          ...appointment,
          services: [{
            id: appointment.serviceId,
            name: appointment.serviceName,
            price: appointment.cost || 0,
            duration: appointment.duration || 30
          }]
        };
        setEditingAppointment(enrichedAppointment);
      } else {
        setEditingAppointment(appointment);
      }
    } else {
      setEditingAppointment(appointment);
    }
    
    setSelectedStylist(stylists.find(s => s.id === appointment.stylistId) || null);
    setSelectedTimeSlot(appointment.startTime);
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
      // Invalidate and force an immediate refetch
      queryClient.invalidateQueries({ queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')] });
      
      // Force refetch to ensure we have the latest data
      refetchAppointments();
      
      console.log("Appointment successfully updated:", data);
      
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

  // Handle drag start event to apply initial styles
  const handleDragStart = () => {
    // Add a class to the body to style during dragging
    document.body.classList.add('is-dragging');
  };
  
  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    // Remove dragging class
    document.body.classList.remove('is-dragging');
    
    // Early return if we don't have a destination
    if (!result.destination) {
      console.log("No destination provided, canceling drag operation");
      return;
    }
    
    try {
      const { draggableId, destination, source } = result;
      
      // If the source and destination are the same, no need to do anything
      if (source.droppableId === destination.droppableId) {
        console.log("Source and destination are the same, no changes needed");
        return;
      }
    
      // Extract the appointment ID from the draggable ID
      const appointmentId = parseInt(draggableId.replace('appointment-', ''));
      
      // Find the appointment in our state
      const appointment = appointments.find(appt => appt.id === appointmentId);
      
      // Safety check - ensure we found the appointment
      if (!appointment) {
        console.error("Could not find appointment with ID:", appointmentId);
        return;
      }
      
      console.log("Moving appointment:", appointment);
      console.log("From:", source.droppableId);
      console.log("To:", destination.droppableId);
      
      // Extract stylist ID and time slot from destination droppable ID
      // Format: stylist-{id}-slot-{time}
      const match = destination.droppableId.match(/stylist-(\d+)-slot-([0-9:.]+\s*[APMapm]*)/);
      
      if (!match) {
        console.error("Invalid destination droppable ID format:", destination.droppableId);
        return;
      }
      
      // Parse the stylist ID and time slot
      const stylistId = parseInt(match[1]);
      const slotTime = match[2].trim();
      
      // Calculate time with 15-minute intervals
      // Parse the time to get hours and minutes
      let newTime = slotTime;
      
      try {
        // If it's in 12-hour format (e.g., "1:00 pm")
        const match12Hr = slotTime.match(/(\d+):(\d+)\s*(am|pm)/i);
        
        if (match12Hr) {
          const hour = parseInt(match12Hr[1]);
          const minute = parseInt(match12Hr[2]);
          const period = match12Hr[3].toLowerCase();
          
          // Convert to 24-hour time for calculations
          let hour24 = hour;
          if (period === 'pm' && hour < 12) hour24 += 12;
          if (period === 'am' && hour === 12) hour24 = 0;
          
          // Round to nearest 15-minute interval
          let roundedMinute = Math.round(minute / 15) * 15;
          let adjustedHour = hour24;
          
          // Handle case where minutes are 60 after rounding
          if (roundedMinute === 60) {
            adjustedHour += 1;
            roundedMinute = 0;
          }
          
          // Format back to 12-hour time
          let hour12 = adjustedHour % 12;
          if (hour12 === 0) hour12 = 12;
          const newPeriod = adjustedHour >= 12 ? 'pm' : 'am';
          
          // Format with leading zeros for minutes
          let minuteStr = roundedMinute.toString();
          if (roundedMinute === 0) {
            minuteStr = '00';
          } else if (roundedMinute < 10) {
            minuteStr = `0${roundedMinute}`;
          }
          
          newTime = `${hour12}:${minuteStr} ${newPeriod}`;
        } else {
          // If it's in 24-hour format (e.g., "13:00")
          const match24Hr = slotTime.match(/(\d+):(\d+)/);
          
          if (match24Hr) {
            const hour = parseInt(match24Hr[1]);
            const minute = parseInt(match24Hr[2]);
            
            // Round to nearest 15-minute interval
            let roundedMinute = Math.round(minute / 15) * 15;
            let adjustedHour = hour;
            
            // Handle case where minutes are 60 after rounding
            if (roundedMinute === 60) {
              adjustedHour += 1;
              roundedMinute = 0;
            }
            
            // Format with leading zeros for minutes
            let minuteStr = roundedMinute.toString();
            if (roundedMinute === 0) {
              minuteStr = '00';
            } else if (roundedMinute < 10) {
              minuteStr = `0${roundedMinute}`;
            }
            
            newTime = `${adjustedHour}:${minuteStr}`;
          }
        }
      } catch (error) {
        console.error("Failed to parse time for 15-minute adjustment:", error);
        // Use the original time if parsing fails
      }
      
      console.log("Target stylist ID:", stylistId);
      console.log("Target time:", newTime);
      
      // Only proceed if we have valid time and stylist data
      if (!stylistId || !newTime) {
        toast({
          title: "Error moving appointment",
          description: "Could not determine the target time or stylist.",
          variant: "destructive",
        });
        return;
      }
      
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
      
      // Check if the time is within salon opening hours (9am-6pm)
      const timeHour = parseInt(newTime.split(':')[0]);
      if (timeHour < 9 || timeHour >= 18) {
        toast({
          title: "Outside operating hours",
          description: "The salon is only open from 9am to 6pm.",
          variant: "destructive",
        });
        return;
      }
      
      // Show loading toast
      toast({
        title: "Moving appointment...",
        description: `Reassigning to ${stylists.find(s => s.id === stylistId)?.name || 'another stylist'}`,
      });
      
      // Calculate new end time to maintain the same duration
      let endTime = "";
      try {
        // Get duration in minutes
        const getTimeInMinutes = (timeStr: string) => {
          // Handle 12-hour format
          const match12Hr = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
          if (match12Hr) {
            const hour = parseInt(match12Hr[1]);
            const minute = parseInt(match12Hr[2]);
            const period = match12Hr[3].toLowerCase();
            
            let hour24 = hour;
            if (period === 'pm' && hour < 12) hour24 += 12;
            if (period === 'am' && hour === 12) hour24 = 0;
            
            return hour24 * 60 + minute;
          }
          
          // Handle 24-hour format
          const match24Hr = timeStr.match(/(\d+):(\d+)/);
          if (match24Hr) {
            const hour = parseInt(match24Hr[1]);
            const minute = parseInt(match24Hr[2]);
            return hour * 60 + minute;
          }
          
          return 0;
        };
        
        // Calculate duration in minutes
        const startMinutes = getTimeInMinutes(appointment.startTime);
        const endMinutes = getTimeInMinutes(appointment.endTime);
        const durationMinutes = endMinutes - startMinutes;
        
        // Get new start time in minutes
        const newStartMinutes = getTimeInMinutes(newTime);
        
        // Calculate new end time in minutes
        const newEndMinutes = newStartMinutes + durationMinutes;
        
        // Convert back to hours and minutes
        const newEndHour = Math.floor(newEndMinutes / 60);
        const newEndMinute = newEndMinutes % 60;
        
        // Handle minutes that need to be rounded
        let minuteStr = newEndMinute.toString();
        if (newEndMinute === 0) {
          minuteStr = '00';
        } else if (newEndMinute < 10) {
          minuteStr = `0${newEndMinute}`;
        }
        
        // Format based on the time format (12-hour or 24-hour)
        if (newTime.match(/am|pm/i)) {
          // 12-hour format
          let hour12 = newEndHour % 12;
          if (hour12 === 0) hour12 = 12;
          const period = newEndHour >= 12 ? 'pm' : 'am';
          endTime = `${hour12}:${minuteStr} ${period}`;
        } else {
          // 24-hour format
          endTime = `${newEndHour}:${minuteStr}`;
        }
      } catch (error) {
        console.error("Failed to calculate new end time:", error);
        // If there's an error, don't update the end time
        endTime = appointment.endTime;
      }
      
      console.log("New end time calculated:", endTime);
      
      // Create a copy of the appointment to update
      const updatedAppointment = {
        ...appointment,
        stylistId,
        startTime: newTime,
        endTime: endTime,
        date: format(currentDate, 'yyyy-MM-dd') // Ensure the date is updated too
      };
      
      console.log("Updating appointment with:", updatedAppointment);
      
      // Update the appointment with new stylist and time
      updateAppointmentMutation.mutate({
        id: appointment.id,
        stylistId,
        startTime: newTime,
        endTime: endTime,
        date: format(currentDate, 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error("Error in drag and drop operation:", error);
      toast({
        title: "Error moving appointment",
        description: "There was a problem updating the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <CalendarToolbar 
        currentDate={formattedDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
        onViewModeChange={setViewMode}
        onNewBooking={() => handleNewBooking()}
      />
      
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-grow overflow-hidden h-[calc(100vh-130px)]">
          {/* Main calendar grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="min-w-max h-full">
              {viewMode === 'day' && (
                <>
                  <StylistHeader stylists={stylists} />
                  <TimeSlots 
                    timeSlots={timeSlots}
                    stylists={stylists}
                    appointments={appointments}
                    onTimeSlotClick={handleNewBooking}
                    onEditAppointment={handleEditAppointment}
                    viewMode={viewMode}
                  />
                </>
              )}
              
              {viewMode === 'week' && (
                <>
                  <StylistHeader stylists={stylists} />
                  <TimeSlots 
                    timeSlots={timeSlots}
                    stylists={stylists}
                    appointments={appointments}
                    onTimeSlotClick={handleNewBooking}
                    onEditAppointment={handleEditAppointment}
                    viewMode={viewMode}
                  />
                </>
              )}
              
              {viewMode === 'month' && (
                <div className="p-4 w-full h-full">
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <h3 className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A] font-semibold mb-2">Month View Coming Soon</h3>
                    <p className="text-gray-600">Month view is under development. Please use Day or Week view for now.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>
      
      <BottomToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        stylists={stylists}
        services={services}
        selectedDate={currentDate}
        selectedTimeSlot={selectedTimeSlot}
        selectedStylist={selectedStylist}
        editingAppointment={editingAppointment}
      />
    </div>
  );
}
