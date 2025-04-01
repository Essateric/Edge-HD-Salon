import { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Trash2, ArrowLeft, Check, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '@/lib/queryClient';
import { Stylist, Service, ServiceCategory, Appointment, AppointmentService } from '@/lib/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: Stylist[];
  services: Service[];
  selectedDate: Date;
  selectedTimeSlot: string | null;
  selectedStylist: Stylist | null;
  editingAppointment?: Appointment | null;
}

interface SelectedServiceItem {
  id: number;
  name: string;
  price: number;
  duration: number;
}

export default function BookingModal({
  isOpen,
  onClose: closeModal,
  stylists,
  services,
  selectedDate,
  selectedTimeSlot,
  selectedStylist,
  editingAppointment
}: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customer, setCustomer] = useState(editingAppointment?.customerName || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>(() => {
    // Initialize with editing appointment service if available
    if (editingAppointment && services) {
      // If we're editing an existing appointment
      if (editingAppointment.services && editingAppointment.services.length > 0) {
        // If the appointment has specific services listed, use those
        return editingAppointment.services.map((svc: AppointmentService) => ({
          id: svc.id,
          name: svc.name,
          price: svc.price || 0,
          duration: svc.duration || 30
        }));
      } else if (editingAppointment.serviceId) {
        // Fallback to using the primary serviceId if no services array
        const service = services.find(s => s.id === editingAppointment.serviceId);
        if (service) {
          return [{
            id: service.id,
            name: service.name,
            price: service.price || 0,
            duration: service.defaultDuration
          }];
        }
      }
    }
    return [];
  });
  const [notes, setNotes] = useState(editingAppointment?.notes || '');
  // Set initial tab - if editing an appointment, start on 'details' tab
  const [activeTab, setActiveTab] = useState(editingAppointment ? 'details' : 'customer');
  const [activeStylist, setActiveStylist] = useState<Stylist | null>(selectedStylist);
  
  // Format date and time
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const formattedTimeDisplay = selectedTimeSlot || '10:00 AM';
  
  // Helper function to format duration in hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
  };
  
  // Calculate total price and duration
  const totalPrice = selectedServices.reduce((total, service) => total + (service.price || 0), 0);
  const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
  
  // Fetch service categories
  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
    enabled: isOpen
  });
  
  // Group services by category
  const servicesByCategory = services.reduce<Record<number, Service[]>>((acc, service) => {
    if (!acc[service.categoryId]) {
      acc[service.categoryId] = [];
    }
    acc[service.categoryId].push(service);
    return acc;
  }, {});
  
  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointment: any) => {
      // Calculate end time based on start time and duration
      const startTime = appointment.startTime;
      const duration = appointment.duration;
      
      // Parse start time (HH:MM format)
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Create date objects for start and end times
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Add end time to the appointment data
      const appointmentWithEndTime = {
        ...appointment,
        endTime: endTimeStr
      };
      
      const res = await apiRequest('/api/appointments', 'POST', appointmentWithEndTime);
      return await res.json();
    }
  });
  
  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (appointment: any) => {
      if (!editingAppointment?.id) {
        throw new Error("No appointment ID for update");
      }
      
      // Calculate end time based on start time and duration
      const startTime = appointment.startTime;
      const duration = appointment.duration;
      
      // Parse start time (HH:MM format)
      const [hours, minutes] = startTime.split(':').map(Number);
      
      // Create date objects for start and end times
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Add end time to the appointment data
      const appointmentWithEndTime = {
        ...appointment,
        endTime: endTimeStr
      };
      
      const res = await apiRequest(`/api/appointments/${editingAppointment.id}`, 'PUT', appointmentWithEndTime);
      return await res.json();
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit if no services are selected
    if (selectedServices.length === 0) {
      toast({
        title: "No services selected",
        description: "Please select at least one service.",
        variant: "destructive",
      });
      return;
    }
    
    // If editing an existing appointment
    if (editingAppointment) {
      // Only support editing the first service for now
      const service = selectedServices[0];
      
      // Get the appointment data
      const appointment = {
        customerName: customer || 'Guest',
        serviceId: service.id,
        serviceName: service.name,
        stylistId: selectedStylist?.id || editingAppointment.stylistId,
        date: formattedDate,
        startTime: selectedTimeSlot || editingAppointment.startTime,
        duration: service.duration,
        notes: notes
      };
      
      // Update the appointment
      updateAppointmentMutation.mutate(appointment, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
          toast({
            title: "Appointment updated",
            description: "The appointment has been successfully updated.",
          });
          resetForm();
          closeModal();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update appointment. Please try again.",
            variant: "destructive",
          });
          console.error(error);
        }
      });
    } else {
      // Create multiple appointments - one for each service
      let currentStartTime = selectedTimeSlot || '10:00';
      let currentDateTime = new Date(`${formattedDate}T${currentStartTime}`);
      
      // Create a promise array to track all appointment creations
      const appointmentPromises = selectedServices.map(async (service, index) => {
        // For each service after the first one, the start time is the end time of the previous service
        if (index > 0) {
          currentDateTime = new Date(currentDateTime.getTime() + (selectedServices[index - 1].duration * 60000));
          currentStartTime = currentDateTime.toTimeString().substring(0, 5);
        }
        
        const appointment = {
          customerName: customer || 'Guest',
          serviceId: service.id,
          serviceName: service.name, // Include service name for display
          stylistId: selectedStylist?.id || stylists[0]?.id || 1,
          date: formattedDate,
          startTime: currentStartTime,
          duration: service.duration,
          notes: notes
        };
        
        return createAppointmentMutation.mutateAsync(appointment);
      });
      
      // Process all appointment creations
      Promise.all(appointmentPromises)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
          toast({
            title: "Appointments created",
            description: `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} scheduled successfully.`,
          });
          resetForm();
          closeModal();
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Failed to create appointments. Please try again.",
            variant: "destructive",
          });
          console.error(error);
        });
    }
  };
  
  const resetForm = () => {
    setCustomer('');
    setNotes('');
    setSelectedCategoryId(null);
    setSelectedServices([]);
    setActiveTab('customer');
  };
  
  // Handle selecting a category
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };
  
  // Toggle service selection
  const toggleServiceSelection = (service: Service) => {
    setSelectedServices(prev => {
      // Check if service is already selected
      const existingIndex = prev.findIndex(s => s.id === service.id);
      
      if (existingIndex >= 0) {
        // Remove service if already selected
        return prev.filter(s => s.id !== service.id);
      } else {
        // Add service if not already selected
        return [
          ...prev, 
          { 
            id: service.id, 
            name: service.name, 
            price: service.price || 0, 
            duration: service.defaultDuration 
          }
        ];
      }
    });
  };
  
  // Check if a service is selected
  const isServiceSelected = (serviceId: number) => {
    return selectedServices.some(s => s.id === serviceId);
  };
  
  // Remove a service from selected services
  const removeService = (serviceId: number) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };
  
  // Function to handle closing the modal
  const handleClose = () => {
    resetForm();
    closeModal();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md md:max-w-2xl bg-black text-white border-amber-800/30" aria-describedby="booking-description">
          <DialogHeader className="border-b border-amber-800/30 pb-4">
            <DialogDescription id="booking-description" className="sr-only">
              Booking appointment form for Edge Salon
            </DialogDescription>
            <DialogTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>
                  {formattedTimeDisplay} {format(selectedDate, 'dd MMMM yyyy')}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-amber-950/20">
              <TabsTrigger 
                value="customer" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
              >
                Customer
              </TabsTrigger>
              <TabsTrigger 
                value="details" 
                className="data-[state=active]:bg-amber-800 data-[state=active]:text-white"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="relative data-[state=active]:bg-amber-800 data-[state=active]:text-white"
              >
                Services
                {selectedServices.length > 0 && (
                  <span className="ml-1 rounded-full bg-white text-black text-xs px-2 py-0.5">
                    {selectedServices.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="customer">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer Name</Label>
                  <Input
                    id="customer"
                    placeholder="Search or enter customer name"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                  />
                </div>
                
                {/* Only show stylist selector if no stylist is pre-selected */}
                {!selectedStylist && (
                  <div className="space-y-2">
                    <Label htmlFor="stylist">Stylist</Label>
                    <select
                      id="stylist"
                      className="w-full px-3 py-2 border rounded-md"
                      value={activeStylist?.id || ""}
                      onChange={(e) => {
                        const stylistId = parseInt(e.target.value);
                        const stylist = stylists.find(s => s.id === stylistId) || null;
                        setActiveStylist(stylist);
                      }}
                    >
                      <option value="" disabled>
                        Select a stylist
                      </option>
                      {stylists.map((stylist) => (
                        <option key={stylist.id} value={stylist.id}>
                          {stylist.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Show selected stylist as text if pre-selected */}
                {selectedStylist && (
                  <div className="space-y-2">
                    <Label>Selected Stylist</Label>
                    <div className="px-3 py-2 border rounded-md bg-muted">
                      {selectedStylist.name}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('details')}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4 py-4">
                {/* Show appointment details when editing */}
                {editingAppointment && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg">Appointment Details</h3>
                      <div className={`px-2 py-1 rounded-md text-xs font-medium 
                        ${editingAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          editingAppointment.status === 'canceled' ? 'bg-red-100 text-red-800' : 
                          editingAppointment.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {editingAppointment.status ? 
                          editingAppointment.status.charAt(0).toUpperCase() + editingAppointment.status.slice(1) : 
                          'Pending'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{editingAppointment.customerName || 'Unspecified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Service</p>
                        <p className="font-medium">{editingAppointment.serviceName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{editingAppointment.startTime} - {editingAppointment.endTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">{editingAppointment.duration ? formatDuration(editingAppointment.duration) : 'N/A'}</p>
                      </div>
                      {editingAppointment.cost && (
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">£{editingAppointment.cost}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes here"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('customer')}>
                    Back
                  </Button>
                  <Button onClick={() => setActiveTab('services')}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="services">
              <div className="grid md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Choose Services</h3>
                  
                  {!selectedCategoryId ? (
                    // Show categories
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search categories..."
                          className="pl-8 bg-black/5 border-0"
                        />
                      </div>
                      
                      {categories.map(category => (
                        <div 
                          key={category.id}
                          className="p-3 border border-amber-800/30 rounded-md cursor-pointer hover:bg-amber-50 hover:bg-opacity-10 bg-black/5"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          <div className="font-medium">{category.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Show services in selected category
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedCategoryId(null)}
                          className="h-8 px-2 border-amber-800/30"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Back
                        </Button>
                        <h4>{categories.find(c => c.id === selectedCategoryId)?.name}</h4>
                      </div>
                      
                      {servicesByCategory[selectedCategoryId]?.map(service => (
                        <div 
                          key={service.id}
                          className={`p-3 border border-amber-800/30 rounded-md flex items-center justify-between cursor-pointer ${isServiceSelected(service.id) ? 'bg-amber-800/10 border-amber-800/50' : 'hover:bg-amber-50 hover:bg-opacity-10 bg-black/5'}`}
                          onClick={() => toggleServiceSelection(service)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDuration(service.defaultDuration)} · £{service.price ? service.price.toFixed(2) : '0.00'}
                            </div>
                          </div>
                          <Checkbox checked={isServiceSelected(service.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Selected Services</h3>
                  
                  {selectedServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-[200px]">
                      <div className="text-base">No services selected</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Select services from the left panel
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center p-3 border border-amber-800/30 rounded-md bg-black/5">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>with {activeStylist?.name || selectedStylist?.name || 'Stylist'}</span>
                              <span className="font-medium">£{service.price?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDuration(service.duration)}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeService(service.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-medium">
                        <span>Total</span>
                        <span>£{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Total duration: {formatDuration(totalDuration)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-2 pt-4 border-t border-amber-800/30">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('details')}
                  className="border-amber-800/30 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={selectedServices.length === 0 || createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-black font-medium"
                >
                  {editingAppointment ? 'Update Appointment' : 'Book Appointment'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
