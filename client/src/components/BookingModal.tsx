import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Trash2 } from 'lucide-react';
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
  price?: number;
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
  const [serviceSelectionOpen, setServiceSelectionOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([]);
  const [date] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [time] = useState(selectedTimeSlot || '10:00');
  const [stylist] = useState(selectedStylist?.id.toString() || '');
  const [totalDuration, setTotalDuration] = useState(0);
  const [notes, setNotes] = useState('');
  
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
      const res = await apiRequest('/api/appointments', 'POST', appointment);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Appointment created",
        description: "The appointment has been successfully scheduled.",
      });
      resetForm();
      closeModal();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const appointment = {
      customerName: customer,
      serviceId: parseInt(service),
      stylistId: parseInt(stylist),
      date,
      startTime: time,
      duration: parseInt(duration),
      notes
    };
    
    createAppointmentMutation.mutate(appointment);
  };
  
  const resetForm = () => {
    setCustomer('');
    setService('');
    setTime('10:00');
    setStylist('');
    setDuration('30');
    setNotes('');
    setSelectedCategoryId(null);
    setServiceSelectionOpen(false);
  };
  
  // Generate time slot options in 15-minute increments from 9am to 7pm
  const timeOptions = [];
  for (let hour = 9; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour >= 12 ? 'pm' : 'am';
      const m = minute.toString().padStart(2, '0');
      timeOptions.push(`${h}:${m} ${ampm}`);
    }
  }
  
  // Handle selecting a category
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setServiceSelectionOpen(true);
  };
  
  // Handle selecting a service
  const handleServiceSelect = (serviceId: string) => {
    setService(serviceId);
    setServiceSelectionOpen(false);
    
    // Set duration based on the selected service
    const selectedService = services.find(s => s.id.toString() === serviceId);
    if (selectedService) {
      setDuration(selectedService.defaultDuration.toString());
    }
  };
  
  // Get the selected service name
  const selectedServiceName = service ? 
    services.find(s => s.id.toString() === service)?.name : '';
  
  // Get the selected stylist name
  const selectedStylistName = stylist ? 
    stylists.find(s => s.id.toString() === stylist)?.name : '';
    
  // Function to handle closing the modal
  const handleClose = () => {
    resetForm();
    closeModal();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>New Appointment</span>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  placeholder="Search or create customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <div 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setServiceSelectionOpen(true)}
                >
                  {selectedServiceName || "Select service"}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    value={time}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stylist">Stylist</Label>
                <Input
                  id="stylist"
                  value={selectedStylistName || ""}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="75">75 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes here"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAppointmentMutation.isPending || !service}>
                Save Appointment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Service Selection Modal */}
      <Dialog open={serviceSelectionOpen} onOpenChange={setServiceSelectionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedCategoryId ? 'Select Service' : 'Select Service Category'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategoryId ? (
            // Display services for the selected category
            <div className="grid gap-2">
              <div className="flex justify-between items-center mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedCategoryId(null)}
                >
                  Back to Categories
                </Button>
              </div>
              
              <div className="grid gap-2">
                {servicesByCategory[selectedCategoryId]?.map(service => (
                  <Card 
                    key={service.id} 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleServiceSelect(service.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground">{service.defaultDuration} minutes</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            // Display service categories
            <div className="grid gap-2">
              {categories.map(category => (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {servicesByCategory[category.id]?.length || 0} services
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
