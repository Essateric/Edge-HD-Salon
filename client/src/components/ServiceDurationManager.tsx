import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ServiceCategory, 
  Service, 
  Stylist, 
  StylistServiceDuration 
} from "@/lib/types";

interface ServiceDurationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  stylistId?: number;
}

export default function ServiceDurationManager({ 
  isOpen, 
  onClose,
  stylistId 
}: ServiceDurationManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [durations, setDurations] = useState<Record<number, Record<number, number>>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch service categories
  const { 
    data: categories,
    isLoading: categoriesLoading
  } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories'],
    enabled: isOpen
  });
  
  // Fetch all stylists
  const { 
    data: stylists,
    isLoading: stylistsLoading
  } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists'],
    enabled: isOpen && !stylistId
  });
  
  // Fetch services by category
  const {
    data: services,
    isLoading: servicesLoading
  } = useQuery<Service[]>({
    queryKey: ['/api/services/category', selectedCategory],
    enabled: isOpen && !!selectedCategory
  });
  
  // Fetch all stylist service durations
  const {
    data: stylistServiceDurations,
    isLoading: durationsLoading
  } = useQuery<StylistServiceDuration[]>({
    queryKey: ['/api/stylist-service-durations', stylistId ? { stylistId } : undefined],
    enabled: isOpen
  });
  
  // Initialize durations map when data is loaded
  useEffect(() => {
    if (stylistServiceDurations && services && stylists) {
      const durationMap: Record<number, Record<number, number>> = {};
      
      // Initialize with default durations for all stylists and services
      const stylistsToProcess = stylistId ? [{ id: stylistId }] : stylists;
      
      stylistsToProcess.forEach(stylist => {
        durationMap[stylist.id] = {};
        if (services) {
          services.forEach(service => {
            durationMap[stylist.id][service.id] = service.defaultDuration;
          });
        }
      });
      
      // Override with any custom durations
      stylistServiceDurations.forEach(duration => {
        if (durationMap[duration.stylistId]) {
          durationMap[duration.stylistId][duration.serviceId] = duration.duration;
        }
      });
      
      setDurations(durationMap);
    }
  }, [stylistServiceDurations, services, stylists, stylistId]);
  
  // Handle duration change
  const handleDurationChange = (stylistId: number, serviceId: number, value: string) => {
    const duration = parseInt(value);
    if (isNaN(duration) || duration < 15) return;
    
    setDurations(prev => ({
      ...prev,
      [stylistId]: {
        ...prev[stylistId],
        [serviceId]: duration
      }
    }));
  };
  
  // Save durations
  const saveDurations = async () => {
    try {
      // Get current durations to compare with changes
      const currentDurations = stylistServiceDurations || [];
      const stylistsToUpdate = stylistId ? [stylistId] : Object.keys(durations).map(id => parseInt(id));
      
      for (const stylistIdStr of stylistsToUpdate.map(id => id.toString())) {
        const stylistIdNum = parseInt(stylistIdStr);
        
        if (services) {
          for (const service of services) {
            const newDuration = durations[stylistIdNum][service.id];
            
            // Skip if it's the same as default duration
            if (newDuration === service.defaultDuration) {
              // If there's an existing custom duration, delete it
              const existingDuration = currentDurations.find(
                d => d.stylistId === stylistIdNum && d.serviceId === service.id
              );
              
              if (existingDuration) {
                await apiRequest(
                  `${'/api/stylist-service-durations'}/${existingDuration.id}`, 
                  'DELETE'
                );
              }
              continue;
            }
            
            // Find if there's already a custom duration for this stylist/service
            const existingDuration = currentDurations.find(
              d => d.stylistId === stylistIdNum && d.serviceId === service.id
            );
            
            if (existingDuration) {
              // Update existing duration
              await apiRequest(
                `${'/api/stylist-service-durations'}/${existingDuration.id}`, 
                'PUT',
                { duration: newDuration }
              );
            } else {
              // Create new duration
              await apiRequest(
                '/api/stylist-service-durations', 
                'POST',
                {
                  stylistId: stylistIdNum,
                  serviceId: service.id,
                  duration: newDuration
                }
              );
            }
          }
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/stylist-service-durations'] });
      
      toast({
        title: "Success",
        description: "Service durations updated successfully",
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to save durations:', error);
      toast({
        title: "Error",
        description: "Failed to save service durations",
        variant: "destructive",
      });
    }
  };
  
  // Check if we're still loading data
  const isLoading = categoriesLoading || (stylistId ? false : stylistsLoading) || 
                   (selectedCategory ? servicesLoading : false) || durationsLoading;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {stylistId 
              ? "Manage Service Durations for Stylist" 
              : "Manage Service Durations for All Stylists"}
          </DialogTitle>
          <DialogDescription>
            Set custom durations for services by stylist. 
            Each stylist can have different durations for the same service.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <p>Loading...</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {/* Service category selector */}
            <div className="flex flex-wrap gap-2">
              {categories?.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {selectedCategory && services && services.length > 0 && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Default (mins)</TableHead>
                      {stylistId ? (
                        <TableHead>Duration (mins)</TableHead>
                      ) : (
                        stylists?.map(stylist => (
                          <TableHead key={stylist.id}>{stylist.name} (mins)</TableHead>
                        ))
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map(service => (
                      <TableRow key={service.id}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.defaultDuration}</TableCell>
                        
                        {stylistId ? (
                          <TableCell>
                            <Input
                              type="number"
                              min={15}
                              step={5}
                              value={durations[stylistId]?.[service.id] || service.defaultDuration}
                              onChange={(e) => handleDurationChange(
                                stylistId,
                                service.id,
                                e.target.value
                              )}
                              className="w-20"
                            />
                          </TableCell>
                        ) : (
                          stylists?.map(stylist => (
                            <TableCell key={stylist.id}>
                              <Input
                                type="number"
                                min={15}
                                step={5}
                                value={durations[stylist.id]?.[service.id] || service.defaultDuration}
                                onChange={(e) => handleDurationChange(
                                  stylist.id,
                                  service.id,
                                  e.target.value
                                )}
                                className="w-20"
                              />
                            </TableCell>
                          ))
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={saveDurations}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}