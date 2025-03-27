import { useState } from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Trash2, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from '@/lib/queryClient';
import { Stylist, Service, ServiceCategory } from '@/lib/types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stylists: Stylist[];
  services: Service[];
  selectedDate: Date;
  selectedTimeSlot: string | null;
  selectedStylist: Stylist | null;
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
  selectedStylist
}: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [customer, setCustomer] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('customer');
  
  // Format date and time
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const formattedTimeDisplay = selectedTimeSlot || '10:00 AM';
  
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
        stylistId: selectedStylist?.id || 1,
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
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-bold">EDGE</span>
                <span>{formattedTimeDisplay} {format(selectedDate, 'dd MMMM yyyy')}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="services" className="relative">
                Services
                {selectedServices.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
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
                
                <div className="space-y-2">
                  <Label htmlFor="stylist">Stylist</Label>
                  <Input
                    id="stylist"
                    value={selectedStylist?.name || "Unassigned"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('details')}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4 py-4">
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
              <div className="grid md:grid-cols-2 gap-4 py-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Choose Services</h3>
                    {selectedCategoryId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedCategoryId(null)}
                        className="h-8 px-2"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Categories
                      </Button>
                    )}
                  </div>
                  
                  {!selectedCategoryId ? (
                    // Show categories
                    <div className="space-y-2">
                      <Input 
                        placeholder="Search categories..."
                        className="mb-2"
                      />
                      {categories.map(category => (
                        <div 
                          key={category.id}
                          className="p-3 border rounded-md cursor-pointer hover:bg-accent"
                          onClick={() => handleCategorySelect(category.id)}
                        >
                          <div className="font-medium">{category.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Show services in selected category
                    <div className="space-y-2">
                      <Input 
                        placeholder="Search services..."
                        className="mb-2"
                      />
                      {servicesByCategory[selectedCategoryId]?.map(service => (
                        <div 
                          key={service.id}
                          className={`p-3 border rounded-md flex items-center justify-between cursor-pointer ${isServiceSelected(service.id) ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}`}
                          onClick={() => toggleServiceSelection(service)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.defaultDuration} min · £{service.price?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <Checkbox checked={isServiceSelected(service.id)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Selected Services</h3>
                  
                  {selectedServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No services selected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedServices.map(service => (
                        <div key={service.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {service.duration} min
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium">£{service.price.toFixed(2)}</div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center font-medium">
                        <span>Total</span>
                        <span>£{totalPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Total duration: {totalDuration} minutes
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setActiveTab('details')}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={selectedServices.length === 0 || createAppointmentMutation.isPending}
                >
                  Book Appointment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
