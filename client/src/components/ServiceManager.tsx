import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ServiceCategory, Service } from "@/lib/types";
import { Plus, Pencil, Trash2, Copy, Save } from "lucide-react";

// Separate component for service row to handle state properly
interface ServiceRowProps {
  service: Service;
  categories?: ServiceCategory[];
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
  queryClient: any;
}

function ServiceRow({ service, categories, onEdit, onDelete, queryClient }: ServiceRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDuration, setEditedDuration] = useState(service.defaultDuration);
  const { toast } = useToast();
  
  const handleDurationSave = async () => {
    try {
      await apiRequest(
        `${'/api/services'}/${service.id}`, 
        'PUT',
        {
          ...service,
          defaultDuration: editedDuration
        }
      );
      
      toast({
        title: "Success",
        description: "Service duration updated",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update service duration:', error);
      toast({
        title: "Error",
        description: "Failed to update service duration",
        variant: "destructive",
      });
    }
  };
  
  const handleDuplicateService = async () => {
    try {
      // Create a new service based on this one
      await apiRequest(
        '/api/services', 
        'POST',
        {
          name: `${service.name} (Copy)`,
          categoryId: service.categoryId,
          defaultDuration: service.defaultDuration
        }
      );
      
      toast({
        title: "Success",
        description: "Service duplicated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      console.error('Failed to duplicate service:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate service",
        variant: "destructive",
      });
    }
  };
  
  return (
    <TableRow key={service.id}>
      <TableCell>{service.name}</TableCell>
      <TableCell>
        {categories?.find(c => c.id === service.categoryId)?.name || "Unknown"}
      </TableCell>
      <TableCell>
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={15}
              step={5}
              value={editedDuration}
              onChange={(e) => setEditedDuration(parseInt(e.target.value) || service.defaultDuration)}
              className="w-20"
            />
            <Button 
              size="icon" 
              variant="outline" 
              onClick={handleDurationSave}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:underline"
            onClick={() => setIsEditing(true)}
          >
            {service.defaultDuration}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => onEdit(service)}
            title="Edit service"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline"
            onClick={handleDuplicateService}
            title="Duplicate service"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="destructive"
            onClick={() => onDelete(service.id)}
            title="Delete service"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ServiceManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceManager({ isOpen, onClose }: ServiceManagerProps) {
  const [activeTab, setActiveTab] = useState("categories");
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  
  const [newService, setNewService] = useState({
    name: "",
    categoryId: 0,
    defaultDuration: 30
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  
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
  
  // Fetch all services
  const { 
    data: services,
    isLoading: servicesLoading
  } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    enabled: isOpen
  });
  
  // Category operations
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await apiRequest(
          `${'/api/service-categories'}/${editingCategory.id}`, 
          'PUT',
          { name: newCategoryName }
        );
        
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        await apiRequest(
          '/api/service-categories', 
          'POST',
          { name: newCategoryName }
        );
        
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      
      // Reset form and refetch categories
      setNewCategoryName("");
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
    } catch (error) {
      console.error('Failed to save category:', error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };
  
  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };
  
  const handleDeleteCategory = async (id: number) => {
    try {
      await apiRequest(`${'/api/service-categories'}/${id}`, 'DELETE');
      
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      
      // Refetch categories and services
      queryClient.invalidateQueries({ queryKey: ['/api/service-categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category. Make sure it has no services.",
        variant: "destructive",
      });
    }
  };
  
  // Service operations
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        // Update existing service
        await apiRequest(
          `${'/api/services'}/${editingService.id}`, 
          'PUT',
          {
            name: newService.name,
            categoryId: newService.categoryId,
            defaultDuration: newService.defaultDuration
          }
        );
        
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        // Create new service
        await apiRequest(
          '/api/services', 
          'POST',
          {
            name: newService.name,
            categoryId: newService.categoryId,
            defaultDuration: newService.defaultDuration
          }
        );
        
        toast({
          title: "Success",
          description: "Service created successfully",
        });
      }
      
      // Reset form and refetch services
      setNewService({
        name: "",
        categoryId: categories?.[0]?.id || 0,
        defaultDuration: 30
      });
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      console.error('Failed to save service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive",
      });
    }
  };
  
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      categoryId: service.categoryId,
      defaultDuration: service.defaultDuration
    });
  };
  
  const handleDeleteService = async (id: number) => {
    try {
      await apiRequest(`${'/api/services'}/${id}`, 'DELETE');
      
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      
      // Refetch services
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service. Make sure it is not used in any appointments.",
        variant: "destructive",
      });
    }
  };
  
  // Reset forms when closing
  const handleClose = () => {
    setNewCategoryName("");
    setEditingCategory(null);
    setNewService({
      name: "",
      categoryId: categories?.[0]?.id || 0,
      defaultDuration: 30
    });
    setEditingService(null);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Services and Categories</DialogTitle>
          <DialogDescription>
            Add, edit, or remove service categories and services.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="space-y-4">
            {/* Categories Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </CardTitle>
                <CardDescription>
                  {editingCategory 
                    ? "Update the name of this category" 
                    : "Create a new service category"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleCategorySubmit}>
                <CardContent>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="categoryName">Name</Label>
                      <Input
                        id="categoryName"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setNewCategoryName("");
                      setEditingCategory(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Update" : "Create"} Category
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            {/* Categories List */}
            <Card>
              <CardHeader>
                <CardTitle>Service Categories</CardTitle>
                <CardDescription>
                  Manage your existing service categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <p>Loading categories...</p>
                ) : categories && categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(category => (
                        <TableRow key={category.id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="icon" 
                                variant="outline"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No categories found. Create one above.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            {/* Services Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingService ? "Edit Service" : "Add New Service"}
                </CardTitle>
                <CardDescription>
                  {editingService 
                    ? "Update this service" 
                    : "Create a new service"}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleServiceSubmit}>
                <CardContent>
                  <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="serviceName">Service Name</Label>
                      <Input
                        id="serviceName"
                        placeholder="Enter service name"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="serviceCategory">Category</Label>
                      <select
                        id="serviceCategory"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newService.categoryId}
                        onChange={(e) => setNewService({
                          ...newService, 
                          categoryId: parseInt(e.target.value)
                        })}
                        required
                      >
                        {categories?.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="serviceDuration">Default Duration (minutes)</Label>
                      <Input
                        id="serviceDuration"
                        type="number"
                        min={15}
                        step={5}
                        placeholder="Enter default duration"
                        value={newService.defaultDuration}
                        onChange={(e) => setNewService({
                          ...newService, 
                          defaultDuration: parseInt(e.target.value) || 30
                        })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setNewService({
                        name: "",
                        categoryId: categories?.[0]?.id || 0,
                        defaultDuration: 30
                      });
                      setEditingService(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingService ? "Update" : "Create"} Service
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            {/* Services List */}
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
                <CardDescription>
                  Manage your existing services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <p>Loading services...</p>
                ) : services && services.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Default Duration (mins)</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map(service => (
                          <ServiceRow 
                            key={service.id}
                            service={service}
                            categories={categories}
                            onEdit={handleEditService}
                            onDelete={handleDeleteService}
                            queryClient={queryClient}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <p>No services found. Create one above.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}