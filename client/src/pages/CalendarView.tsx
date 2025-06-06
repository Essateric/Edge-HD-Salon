import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import EdgeSalonTopBar from '@/components/EdgeSalonTopBar';
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
    // Extended stale time to prevent refetches during drag operations
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds 
    // Additional stability measures
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: 60000, // Gentle background refresh every minute
    retry: 3,
    retryDelay: 2000
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
          // If we received appointment data with the message
          if (lastMessage.appointment) {
            // Also save to the global backup in case of issues
            window.lastMovedAppointment = lastMessage.appointment;
            console.log("WebSocket: Saved new appointment to global backup:", lastMessage.appointment);
            
            // Update local state first for immediate UI feedback
            setLocalAppointments(prev => {
              // Use the flag pattern for better tracking
              let updated = false;
              const newAppointments = prev.map(a => {
                if (a.id === lastMessage.appointment.id) {
                  updated = true;
                  return lastMessage.appointment;
                }
                return a;
              });
              
              // If the appointment wasn't in the array, add it
              if (!updated && lastMessage.appointment) {
                newAppointments.push(lastMessage.appointment);
              }
              
              return newAppointments;
            });
          }
          
          // Then refresh from server in the background
          refetchAppointments();
          
          toast({
            title: "New appointment created",
            description: "Calendar has been updated with a new booking.",
            variant: "default",
          });
          break;
          
        case 'appointment_updated':
          // If we received appointment data with the message
          if (lastMessage.appointment) {
            // Also save to the global backup in case of issues
            window.lastMovedAppointment = lastMessage.appointment;
            console.log("WebSocket: Saved updated appointment to global backup:", lastMessage.appointment);
            
            // Update local state first for immediate UI feedback
            setLocalAppointments(prev => {
              // Use the flag pattern for better tracking
              let updated = false;
              const newAppointments = prev.map(a => {
                if (a.id === lastMessage.appointment.id) {
                  updated = true;
                  return lastMessage.appointment;
                }
                return a;
              });
              
              // If the appointment wasn't in the array, add it
              if (!updated && lastMessage.appointment) {
                newAppointments.push(lastMessage.appointment);
              }
              
              return newAppointments;
            });
          }
          
          // Then refresh from server in the background
          refetchAppointments();
          
          toast({
            title: "Appointment updated",
            description: "An appointment has been modified.",
            variant: "default",
          });
          break;
          
        case 'appointment_deleted':
          // If we received appointment ID with the message
          if (lastMessage.appointmentId) {
            // Update local state first for immediate UI feedback
            setLocalAppointments(prev => 
              prev.filter(a => a.id !== lastMessage.appointmentId)
            );
          }
          
          // Then refresh from server in the background
          refetchAppointments();
          
          toast({
            title: "Appointment removed",
            description: "An appointment has been cancelled.",
            variant: "default",
          });
          break;
          
        case 'connection':
          console.log('Connected to WebSocket server');
          // On reconnect, refresh appointments to get latest data
          refetchAppointments();
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
  
  // Generate time slots from 9am to 8pm
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour <= 20; hour++) {
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
    mutationFn: async (updatedAppointment: Appointment) => {
      const res = await apiRequest(`/api/appointments/${updatedAppointment.id}`, 'PUT', updatedAppointment);
      return res.json();
    },
    onSuccess: (data) => {
      // Default success handler - used when the mutation is called without explicit handlers
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
      
      // After we've handled the local update, we'll invalidate the cache, but with a much longer delay
      // This ensures the UI remains stable during drag operations and prevents appointments from disappearing
      setTimeout(() => {
        // First, ensure our local state is still correctly reflecting this update
        window.lastMovedAppointment = updatedAppointment;
        
        // Then we can safely invalidate to refresh data from server
        console.log("Safe to invalidate cache now, appointment is stable in local state");
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      }, 5000); // Increased to 5 seconds for better stability
    },
    onError: (error) => {
      // Default error handler - used when the mutation is called without explicit error handler
      console.error("Error updating appointment:", error);
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

  // Enhanced drag start event handler with visual feedback
  const handleDragStart = (start: any) => {
    try {
      // Add a class to the body to style during dragging
      document.body.classList.add('is-dragging');
      
      // Add a class to all time slots to indicate draggable state
      const timeSlotElements = document.querySelectorAll<HTMLElement>('.time-slot');
      
      // Apply classes inside the try block
      timeSlotElements.forEach((el: HTMLElement) => {
        el.classList.add('edgesalon-droppable');
      });
      
      // If we have the draggable ID, highlight it specially
      if (start && start.draggableId) {
        const appointmentId = start.draggableId.replace('appointment-', '');
        const appointmentEl = document.querySelector<HTMLElement>(`[data-appointment-id="${appointmentId}"]`);
        if (appointmentEl) {
          appointmentEl.classList.add('edgesalon-dragging');
        }
      }
      
      // Save the start state for potential use in drag end
      window.dragStartState = start;
      
      console.log("Drag started:", start);
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  };
  
  // Enhanced drag end event with improved error handling
  const handleDragEnd = (result: DropResult) => {
    try {
      // Clean up all drag-related classes
      document.body.classList.remove('is-dragging');
      
      const timeSlotElements = document.querySelectorAll<HTMLElement>('.time-slot');
      timeSlotElements.forEach((el: HTMLElement) => {
        el.classList.remove('edgesalon-droppable');
        el.classList.remove('edgesalon-over');
      });
      
      // Remove any dragging indicators
      const draggingEls = document.querySelectorAll<HTMLElement>('.edgesalon-dragging');
      draggingEls.forEach((el: HTMLElement) => {
        el.classList.remove('edgesalon-dragging');
      });
      
      // Also clean up grip elements
      const moveGrips = document.querySelectorAll<HTMLElement>('.moveGrip');
      const resizeGrips = document.querySelectorAll<HTMLElement>('.resizeGrip');
      
      moveGrips.forEach((el: HTMLElement) => {
        el.classList.remove('attached-to-drag');
      });
      
      resizeGrips.forEach((el: HTMLElement) => {
        el.classList.remove('attached-to-drag');
      });
      
      // Add smooth animation to the appointment being dropped
      const draggedElementId = result.draggableId.replace('appointment-', '');
      const appointmentEl = document.querySelector<HTMLElement>(`[data-appointment-id="${draggedElementId}"]`);
      
      if (appointmentEl) {
        // Add a brief animation class for smooth transition
        appointmentEl.classList.add('appointment-dropped');
        
        // Remove the class after animation completes
        setTimeout(() => {
          appointmentEl.classList.remove('appointment-dropped');
        }, 300);
      }
      
      // Early return if we don't have a destination
      if (!result.destination) {
        console.log("No destination provided, canceling drag operation");
        return;
      }
      
      const { draggableId, destination, source } = result;
      
      if (source.droppableId === destination.droppableId) {
        console.log("Source and destination are the same, no changes needed");
        return;
      }
    
      // Parse the appointment ID from the draggable ID
      const numericAppointmentId = parseInt(draggableId.replace('appointment-', ''));
      
      // Find the appointment either in local state or server state
      const appointment = localAppointments.find(appt => appt.id === numericAppointmentId) || 
                        appointments.find(appt => appt.id === numericAppointmentId);
      
      if (!appointment) {
        console.error("Could not find appointment with ID:", numericAppointmentId);
        return;
      }
      
      console.log("Moving appointment:", appointment);
      console.log("From:", source.droppableId);
      console.log("To:", destination.droppableId);
      
      // With the updated TimeSlots component, we now have the format "stylist-{id}"
      const match = destination.droppableId.match(/stylist-(\d+)/);
      
      if (!match) {
        console.error("Invalid destination droppable ID format:", destination.droppableId);
        console.log("Expected format: stylist-{id}");
        return;
      }
      
      const newStylistId = parseInt(match[1]);
      
      // Since we don't have the time in the droppableId anymore, we need to calculate
      // the time based on the drop position relative to the calendar
      
      // Find the closest time slot visually
      const timeSlots = document.querySelectorAll<HTMLElement>(`[data-slot-id^="stylist-${newStylistId}-slot-"]`);
      const calendarContainer = document.querySelector<HTMLElement>('.non-scrollable-container');
      if (!calendarContainer) {
        console.error("Could not find calendar container");
        return;
      }
      
      // Get the drop position relative to the calendar container
      const dropY = destination.index * 20; // Rough approximation
      // Explicitly typed to ensure TypeScript recognizes it as an HTMLElement
      let closestSlot: HTMLElement | null = null;
      let closestDistance = Infinity;
      
      // Find the time slot closest to the drop position
      timeSlots.forEach((slot: HTMLElement) => {
        const rect = slot.getBoundingClientRect();
        const slotY = rect.top - calendarContainer.getBoundingClientRect().top;
        const distance = Math.abs(slotY - dropY);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSlot = slot;
        }
      });
      
      if (!closestSlot) {
        console.error("Could not find a time slot near the drop position");
        return;
      }
      
      // Extract the time from the data-slot-id attribute
      // Using type assertion to tell TypeScript this is an HTML element
      const slotId = (closestSlot as HTMLElement).getAttribute('data-slot-id');
      if (!slotId) {
        console.error("Time slot is missing data-slot-id attribute");
        return;
      }
      
      const timeMatch = slotId.match(/slot-([0-9:.]+\s*[APMapm]*)/);
      if (!timeMatch) {
        console.error("Could not extract time from slot ID:", slotId);
        return;
      }
      
      const newStartTime = timeMatch[1];
      
      if (isNaN(newStylistId)) {
        console.error("Invalid stylist ID:", newStylistId);
        return;
      }
      
      const newStylist = stylists.find(s => s.id === newStylistId);
      if (!newStylist) {
        console.error("Could not find stylist with ID:", newStylistId);
        return;
      }
      
      const [timeStr, period] = newStartTime.trim().split(/\s+/);
      let [hours, minutes] = timeStr.split(':').map(Number);
      
      if (period && period.toLowerCase() === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period && period.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      const formattedStartTime = `${hours}:${minutes || '00'}`;
      const startTimeInMinutes = hours * 60 + (minutes || 0);
      const endTimeInMinutes = startTimeInMinutes + (appointment.duration || 30);
      const endHours = Math.floor(endTimeInMinutes / 60);
      const endMinutes = endTimeInMinutes % 60;
      const formattedEndTime = `${endHours}:${endMinutes === 0 ? '00' : endMinutes}`;
      
      if (hasTimeOverlap({
        ...appointment,
        stylistId: newStylistId,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      }, newStylistId)) {
        console.warn("Overlap detected with appointment:", appointment);
        toast({
          title: "Cannot move appointment",
          description: "This time slot already has an appointment. Please choose another time.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a complete appointment object with all necessary fields
      const updatedAppointment = {
        ...appointment,
        stylistId: newStylistId,
        stylistName: newStylist.name,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
      
      // First, keep a copy of the current state for potential rollback
      const previousAppointments = [...localAppointments];
      
      console.log(`handleDragEnd: Moving appointment ${numericAppointmentId} to stylist ${newStylistId} at ${formattedStartTime}`);
      
      // Save this appointment immediately to the global variable to ensure it doesn't disappear
      window.lastMovedAppointment = updatedAppointment;
      console.log("Setting window.lastMovedAppointment:", window.lastMovedAppointment);
      
      // CRITICAL FLAG SYSTEM: This flag pattern is essential to ensure appointments are correctly updated
      setLocalAppointments(prev => {
        let updated = false;
        const newAppointments = prev.map(appt => {
          if (appt.id === numericAppointmentId) {
            updated = true;
            console.log("Updated existing appointment in local state:", appt.id);
            return updatedAppointment;
          }
          return appt;
        });
        
        // If the appointment wasn't found in our array, add it
        if (!updated) {
          console.log("Adding new appointment to local state:", numericAppointmentId);
          newAppointments.push(updatedAppointment);
        }
        
        return newAppointments;
      });
      
      // Authentication check
      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please log in to move appointments.",
          variant: "destructive",
        });
        setIsLoggingIn(true);
        return;
      }
      
      // Make sure we're preserving all important fields in the request
      const completeAppointmentData = {
        ...appointment,
        stylistId: newStylistId,
        stylistName: newStylist.name,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        date: appointment.date, // Make sure date is included
        customerName: appointment.customerName,
        serviceName: appointment.serviceName,
        duration: appointment.duration,
        cost: appointment.cost,
        status: appointment.status,
        services: appointment.services
      };
      
      // Save this appointment to global state as a backup
      window.lastMovedAppointment = completeAppointmentData;
      
      // Send the update to the server with complete data
      updateAppointmentMutation.mutate(completeAppointmentData, {
        onSuccess: (data) => {
          console.log("Appointment successfully updated on server:", data);
          toast({
            title: "Appointment moved",
            description: "The appointment has been successfully reassigned.",
            variant: "default",
          });
        },
        onError: (error) => {
          console.error("Error updating appointment:", error);
          toast({
            title: "Error updating appointment",
            description: "The appointment was not saved on the server, but is visible in your calendar. Try again.",
            variant: "destructive",
          });
        }
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
    <div className="flex flex-col h-full w-full bg-gray-50">
      {/* Edge Salon Top Bar */}
      <EdgeSalonTopBar 
        currentDate={currentDate}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 min-w-full overflow-y-auto overflow-x-auto">
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
          <div className="p-4" style={{ 
            width: '100%', 
            minWidth: 'fit-content',
            overflowX: 'visible', 
            overflowY: 'hidden' 
          }}>
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
                    appointments={
                      // First try local state if available
                      localAppointments.length > 0 
                        ? localAppointments 
                        // Then try server state
                        : (appointments.length > 0 
                          ? appointments 
                          // Finally fall back to a single appointment from global backup if available
                          : (window.lastMovedAppointment ? [window.lastMovedAppointment] : []))
                    }
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
                    appointments={
                      // First try local state if available
                      localAppointments.length > 0 
                        ? localAppointments 
                        // Then try server state
                        : (appointments.length > 0 
                          ? appointments 
                          // Finally fall back to a single appointment from global backup if available
                          : (window.lastMovedAppointment ? [window.lastMovedAppointment] : []))
                    }
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
      <BottomToolbar currentUser={currentUser} viewMode={viewMode} onViewModeChange={setViewMode} />
      
      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBookingModal}
          selectedTimeSlot={selectedTimeSlot}
          selectedStylist={selectedStylist}
          stylists={stylists}
          services={services}
          selectedDate={currentDate}
          editingAppointment={editingAppointment}
        />
      )}
    </div>
  );
}
