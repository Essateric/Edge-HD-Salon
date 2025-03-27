import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse, isValid, addDays } from 'date-fns';
import { Search, Calendar, CheckCircle, XCircle, RefreshCw, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Appointment, Stylist, Service } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

export default function AppointmentsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch all appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const res = await apiRequest('/api/appointments', 'GET');
      return res.json();
    }
  });

  // Fetch stylists
  const { data: stylists = [] } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services']
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (updatedAppointment: Partial<Appointment>) => {
      const res = await apiRequest(`/api/appointments/${updatedAppointment.id}`, 'PUT', updatedAppointment);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment updated",
        description: "The appointment has been successfully updated.",
      });
      setIsRescheduleModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the appointment.",
        variant: "destructive",
      });
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest(`/api/appointments/${appointmentId}`, 'DELETE');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been successfully cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel the appointment.",
        variant: "destructive",
      });
    }
  });

  // Filter appointments based on search query
  const filteredAppointments = appointments.filter(appointment => {
    const searchLower = searchQuery.toLowerCase();
    const customerName = appointment.customerName?.toLowerCase() || '';
    return customerName.includes(searchLower);
  });

  // Group appointments by date
  const appointmentsByDate = filteredAppointments.reduce<Record<string, Appointment[]>>((acc, appointment) => {
    const date = appointment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {});

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Handle rescheduling an appointment
  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(new Date(appointment.date));
    setSelectedTime(appointment.startTime);
    setIsRescheduleModalOpen(true);
  };

  // Handle confirming an appointment
  const handleConfirm = (appointment: Appointment) => {
    updateAppointmentMutation.mutate({
      id: appointment.id,
      status: 'confirmed'
    });
  };

  // Handle cancelling an appointment
  const handleCancel = (appointment: Appointment) => {
    if (window.confirm(`Are you sure you want to cancel this appointment for ${appointment.customerName}?`)) {
      deleteAppointmentMutation.mutate(appointment.id);
    }
  };

  // Save rescheduled appointment
  const saveReschedule = () => {
    if (!selectedAppointment || !selectedDate || !selectedTime) return;

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    // Parse the selected time for end time calculation
    let startTimeObj;
    if (selectedTime.includes('am') || selectedTime.includes('pm')) {
      startTimeObj = parse(selectedTime, 'h:mm a', new Date());
    } else {
      startTimeObj = parse(selectedTime, 'HH:mm', new Date());
    }
    
    if (!isValid(startTimeObj)) {
      toast({
        title: "Invalid time",
        description: "Please select a valid time.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate end time based on appointment duration
    const durationMins = selectedAppointment.duration || 30;
    const endTimeObj = new Date(startTimeObj.getTime() + durationMins * 60000);
    const endTime = format(endTimeObj, 'h:mm a');
    
    updateAppointmentMutation.mutate({
      id: selectedAppointment.id,
      date: formattedDate,
      startTime: selectedTime,
      endTime: endTime
    });
  };

  // Generate time slots for the select dropdown
  const generateTimeSlots = () => {
    const timeSlots = [];
    
    // 9am to 7pm, every 15 minutes
    for (let hour = 9; hour <= 19; hour++) {
      const isPM = hour >= 12;
      const hour12 = hour % 12 || 12;
      
      for (let minute = 0; minute < 60; minute += 15) {
        timeSlots.push({
          value: `${hour}:${minute.toString().padStart(2, '0')}`,
          label: `${hour12}:${minute.toString().padStart(2, '0')} ${isPM ? 'pm' : 'am'}`
        });
      }
    }
    
    return timeSlots;
  };

  const timeSlots = generateTimeSlots();

  // Get stylist name from ID
  const getStylistName = (stylistId: number) => {
    const stylist = stylists.find(s => s.id === stylistId);
    return stylist ? stylist.name : 'Unknown';
  };

  // Get service name from ID
  const getServiceName = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Unknown';
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4B78E] to-[#8B734A]">
          Appointments Dashboard
        </h1>
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No appointments found.</p>
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointmentsByDate[date].map(appointment => (
                <Card key={appointment.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#D4B78E]/10 to-[#8B734A]/10 py-3">
                    <CardTitle className="flex justify-between items-center">
                      <span>{appointment.customerName || 'Guest'}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {appointment.startTime} - {appointment.endTime}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Stylist:</div>
                      <div className="font-medium">{getStylistName(appointment.stylistId)}</div>
                      
                      <div className="text-muted-foreground">Service:</div>
                      <div className="font-medium">{appointment.serviceName}</div>
                      
                      <div className="text-muted-foreground">Duration:</div>
                      <div className="font-medium">{appointment.duration || 30} minutes</div>
                      
                      {appointment.notes && (
                        <>
                          <div className="text-muted-foreground">Notes:</div>
                          <div className="font-medium">{appointment.notes}</div>
                        </>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="bg-muted/50 py-2 px-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfirm(appointment)}
                      title="Confirm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirm
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReschedule(appointment)}
                      title="Reschedule"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reschedule
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(appointment)}
                      title="Cancel"
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
      
      {/* Reschedule Modal */}
      <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="date" className="text-sm font-medium">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left"
                    id="date"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="time" className="text-sm font-medium">
                Time
              </label>
              <Select onValueChange={setSelectedTime} defaultValue={selectedTime || undefined}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.label}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveReschedule} disabled={!selectedDate || !selectedTime}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}