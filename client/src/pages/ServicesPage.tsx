import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ServiceCategory, 
  Service, 
  Stylist,
  StylistServiceDuration
} from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, User, Settings } from "lucide-react";
import ServiceManager from "@/components/ServiceManager";
import ServiceDurationManager from "@/components/ServiceDurationManager";

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isServiceManagerOpen, setIsServiceManagerOpen] = useState(false);
  const [isDurationManagerOpen, setIsDurationManagerOpen] = useState(false);
  const [selectedStylistId, setSelectedStylistId] = useState<number | undefined>(undefined);
  
  // Fetch service categories
  const { 
    data: categories,
    isLoading: categoriesLoading
  } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service-categories']
  });
  
  // Fetch all services
  const { 
    data: services,
    isLoading: servicesLoading
  } = useQuery<Service[]>({
    queryKey: ['/api/services']
  });
  
  // Fetch all stylists
  const { 
    data: stylists,
    isLoading: stylistsLoading
  } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });
  
  // Fetch all durations
  const {
    data: durations,
    isLoading: durationsLoading
  } = useQuery<StylistServiceDuration[]>({
    queryKey: ['/api/stylist-service-durations']
  });
  
  const getFilteredServices = () => {
    if (!services) return [];
    
    return services.filter(service => 
      activeCategory ? service.categoryId === activeCategory : true
    );
  };
  
  const getCategoryName = (categoryId: number) => {
    return categories?.find(c => c.id === categoryId)?.name || "Uncategorized";
  };
  
  // Get duration for a service and stylist
  const getServiceDuration = (serviceId: number, stylistId: number) => {
    if (!durations) return null;
    
    return durations.find(
      d => d.serviceId === serviceId && d.stylistId === stylistId
    );
  };
  
  // Check if a service has any custom durations
  const hasCustomDurations = (serviceId: number) => {
    if (!durations) return false;
    
    return durations.some(d => d.serviceId === serviceId);
  };
  
  // Open duration manager for a specific stylist
  const openStylistDurationManager = (stylistId: number) => {
    setSelectedStylistId(stylistId);
    setIsDurationManagerOpen(true);
  };
  
  const openAllStylistsDurationManager = () => {
    setSelectedStylistId(undefined);
    setIsDurationManagerOpen(true);
  };
  
  const isLoading = categoriesLoading || servicesLoading || stylistsLoading || durationsLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-4">
          <div className="flex items-center justify-center p-12">
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Services Management</h1>
            <p className="text-muted-foreground">
              Manage salon services, categories, and durations by stylist
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={openAllStylistsDurationManager}
            >
              <Clock className="mr-2 h-4 w-4" />
              Manage Service Durations
            </Button>
            <Button onClick={() => setIsServiceManagerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Manage Services
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Categories Sidebar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button
                  variant={activeCategory === null ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setActiveCategory(null)}
                >
                  All Services
                </Button>
                
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Services List */}
          <div className="md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeCategory 
                    ? `${getCategoryName(activeCategory)} Services` 
                    : "All Services"}
                </CardTitle>
                <CardDescription>
                  {activeCategory 
                    ? `Showing services in ${getCategoryName(activeCategory)} category` 
                    : "Showing all services across all categories"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getFilteredServices().length === 0 ? (
                  <div className="text-center p-6">
                    <p>No services found in this category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {getFilteredServices().map((service) => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{service.name}</CardTitle>
                              <CardDescription>
                                {getCategoryName(service.categoryId)}
                              </CardDescription>
                            </div>
                            <Badge variant="outline">
                              {service.defaultDuration} mins
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {hasCustomDurations(service.id) 
                                ? "Custom Durations by Stylist" 
                                : "Default Duration for All Stylists"}
                            </h4>
                            
                            {stylists && stylists.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {stylists.map((stylist) => {
                                  const customDuration = getServiceDuration(service.id, stylist.id);
                                  
                                  return (
                                    <div 
                                      key={stylist.id} 
                                      className={`p-2 rounded-md border ${
                                        customDuration ? 'border-primary/20' : 'border-border'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                                          <img 
                                            src={stylist.imageUrl} 
                                            alt={stylist.name} 
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-grow">
                                          <p className="text-sm font-medium">{stylist.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {customDuration 
                                              ? `${customDuration.duration} mins` 
                                              : `${service.defaultDuration} mins (default)`}
                                          </p>
                                        </div>
                                        <Button 
                                          size="icon" 
                                          variant="ghost"
                                          onClick={() => openStylistDurationManager(stylist.id)}
                                        >
                                          <Settings className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Service Manager Dialog */}
      <ServiceManager 
        isOpen={isServiceManagerOpen} 
        onClose={() => setIsServiceManagerOpen(false)} 
      />
      
      {/* Duration Manager Dialog */}
      <ServiceDurationManager 
        isOpen={isDurationManagerOpen} 
        onClose={() => setIsDurationManagerOpen(false)}
        stylistId={selectedStylistId}
      />
    </div>
  );
}