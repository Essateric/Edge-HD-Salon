import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Service } from '@/lib/types';

interface ServicesPanelProps {
  services: Service[];
}

export default function ServicesPanel({ services }: ServicesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Cut & Finish');
  
  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
  
  const categories = Object.keys(servicesByCategory);
  
  const filteredServices = services.filter(
    (service) => service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const displayedServices = searchTerm ? 
    filteredServices : 
    (servicesByCategory[selectedCategory] || []);
  
  return (
    <div className="hidden md:block w-72 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-800">Customer</h3>
          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Unspecified</span>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-gray-800 mb-2">Details</h3>
          <Input 
            type="text" 
            placeholder="Search customer..." 
            className="w-full mb-2" 
          />
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">Services</h3>
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Search categories..." 
            className="w-full" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Service Categories */}
        <div className="mt-3">
          {!searchTerm && (
            <div 
              className="bg-gray-800 text-white px-3 py-2 rounded-md mb-2"
              onClick={() => setSelectedCategory(selectedCategory)}
            >
              <span className="font-medium">{selectedCategory}</span>
            </div>
          )}
          
          {/* Service Items */}
          <div className="space-y-2 mt-3">
            {displayedServices.map((service) => (
              <div 
                key={service.id}
                className="px-3 py-2 hover:bg-gray-100 rounded-md cursor-pointer transition"
              >
                <span>{service.name}</span>
              </div>
            ))}
            
            {displayedServices.length === 0 && (
              <div className="text-gray-500 text-sm px-3 py-2">
                No services found. Try a different search term.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
