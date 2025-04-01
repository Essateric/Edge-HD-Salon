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
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [showServices, setShowServices] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch current user
  const { data: currentUser, isLoading: isLoadingUser, refetch: refetchUser } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/auth/me', 'GET');
        if (res.status === 401) {
          return null;
        }
        return await res.json();
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        return null;
      }
    },
    retry: false
  });
  
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
  const { data: appointments = [], refetch: refetchAppointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      try {
        const res = await apiRequest(`/api/appointments?date=${format(currentDate, 'yyyy-MM-dd')}`, 'GET');
        console.log("Fetched appointments from API:", await res.clone().json());
        return await res.json();
      } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
    },
    // Don't refetch too aggressively during drag operations
    refetchOnWindowFocus: false,
    staleTime: 10000
  });
  
  // Keep a local state copy of appointments to avoid losing them during drags
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);
  
  // Sync remote appointments to local state whenever they change
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      console.log("Updating local appointments:", appointments);
      setLocalAppointments(appointments.map(appt => ({...appt})));
    }
  }, [appointments]);
  
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
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest('/api/auth/login', 'POST', credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Login failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Login successful',
        description: 'You are now logged in.',
        variant: 'default',
      });
      refetchUser();
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message || 'An error occurred during login.',
        variant: 'destructive',
      });
    }
  });

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      await loginMutation.mutateAsync({ email, password });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  const updateAppointmentMutation = useMutation({
    mutationFn: async (updatedAppointment: Partial<Appointment>) => {
      const res = await apiRequest(`/api/appointments/${updatedAppointment.id}`, 'PUT', updatedAppointment);
      return res.json();
    },
    onSuccess: (data) => {
      // Show success toast first
      toast({
        title: "Appointment moved",
        description: "The appointment has been successfully reassigned.",
        variant: "default",
      });
      
      console.log("Appointment successfully updated:", data);
      
      // Immediately update our local state to avoid visual flickering/disappearing
      const updatedAppointment = data as Appointment;
      
      // Find and update the appointment in local state
      setLocalAppointments(prevAppointments => {
        const newAppointments = [...prevAppointments];
        const index = newAppointments.findIndex(appt => appt.id === updatedAppointment.id);
        
        if (index >= 0) {
          newAppointments[index] = { ...newAppointments[index], ...updatedAppointment };
          console.log("Updated appointment in local state:", newAppointments[index]);
        } else {
          // If not found, add it
          newAppointments.push(updatedAppointment);
          console.log("Added new appointment to local state:", updatedAppointment);
        }
        
        return newAppointments;
      });
      
      // Still invalidate the cache but with a delay
      setTimeout(() => {
        // Invalidate all appointments queries to refresh data from server
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      }, 500);
    },
    onError: (error) => {
      console.error("Error updating appointment:", error);
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
      const appointment = localAppointments.find(appt => appt.id === appointmentId) || 
                        appointments.find(appt => appt.id === appointmentId);
      
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
      
      // Parse the stylist ID and time
      const newStylistId = parseInt(match[1]);
      const newStartTime = match[2];
      
      // Ensure we have valid numbers
      if (isNaN(newStylistId)) {
        console.error("Invalid stylist ID:", match[1]);
        return;
      }
      
      // Get the stylist object
      const newStylist = stylists.find(s => s.id === newStylistId);
      if (!newStylist) {
        console.error("Could not find stylist with ID:", newStylistId);
        return;
      }
      
      // Calculate start and end times
      // Split the time into hour and minute components
      const [timeStr, period] = newStartTime.trim().split(/\s+/);
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      // Adjust for PM if needed
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      // Adjust for AM if needed
      if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      // Format the new start time in 24-hour format
      const formattedStartTime = `${hours}:${minutes || '00'}`;
      
      // Calculate end time based on the appointment duration
      // Convert start time to minutes
      const startTimeInMinutes = hours * 60 + (minutes || 0);
      
      // Add the appointment duration
      const endTimeInMinutes = startTimeInMinutes + (appointment.duration || 30);
      
      // Convert back to hours and minutes
      const endHours = Math.floor(endTimeInMinutes / 60);
      const endMinutes = endTimeInMinutes % 60;
      
      // Format the end time in 24-hour format
      const formattedEndTime = `${endHours}:${endMinutes === 0 ? '00' : endMinutes}`;
      
      // Check for time slot overlaps
      if (hasTimeOverlap({
        ...appointment,
        stylistId: newStylistId,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }, newStylistId)) {
        console.log("Time overlap detected, showing warning");
        toast({
          title: "Cannot move appointment",
          description: "This time slot already has an appointment. Please choose another time.",
          variant: "destructive",
        });
        return;
      }
      
      // Clone appointment for local update
      const updatedAppointment = {
        ...appointment,
        stylistId: newStylistId,
        stylistName: newStylist.name,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
      
      // First update the local state for immediate UI feedback
      setLocalAppointments(prev => {
        const newAppointments = prev.map(appt => {
          if (appt.id === appointmentId) {
            return updatedAppointment;
          }
          return appt;
        });
        
        // If the appointment wasn't in the local state yet, add it
        if (!newAppointments.some(appt => appt.id === appointmentId)) {
          newAppointments.push(updatedAppointment);
        }
        
        return newAppointments;
      });
      
      // Check if user is logged in before making API requests
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please log in to move appointments.",
          variant: "destructive",
        });
        setIsLoggingIn(true);
        return;
      }
      
      // Then send the update to the server
      updateAppointmentMutation.mutate({
        id: appointment.id,
        stylistId: newStylistId,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      });
      
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
      toast({
        title: "Error moving appointment",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Calendar Toolbar */}
      <CalendarToolbar 
        formattedDate={formattedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Login Form - Show if not logged in and when needed */}
        {isLoggingIn && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[350px] max-w-[90vw]">
              <CardHeader>
                <CardTitle>Login Required</CardTitle>
                <CardDescription>
                  Please log in to manage appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setIsLoggingIn(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleLogin} disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Main Calendar Grid */}
        <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div className="p-4">
            {isLoadingAppointments ? (
              <div className="flex justify-center items-center h-[500px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              viewMode === 'day' ? (
                <>
                  <StylistHeader stylists={stylists} />
                  <TimeSlots 
                    timeSlots={timeSlots}
                    stylists={stylists}
                    appointments={localAppointments.length > 0 ? localAppointments : appointments}
                    onTimeSlotClick={handleNewBooking}
                    onEditAppointment={handleEditAppointment}
                    viewMode={viewMode}
                  />
                </>
              ) : (
                <>
                  <StylistHeader stylists={stylists} />
                  <TimeSlots 
                    timeSlots={timeSlots}
                    stylists={stylists}
                    appointments={localAppointments.length > 0 ? localAppointments : appointments}
                    onTimeSlotClick={handleNewBooking}
                    onEditAppointment={handleEditAppointment}
                    viewMode={viewMode}
                  />
                </>
              )
            )}
          </div>
        </DragDropContext>
      </div>
      
      {/* Bottom Toolbar */}
      <BottomToolbar currentUser={currentUser} />
      
      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBookingModal}
          timeSlot={selectedTimeSlot}
          stylist={selectedStylist}
          services={services}
          date={currentDate}
          editingAppointment={editingAppointment}
        />
      )}
    </div>
  );
}