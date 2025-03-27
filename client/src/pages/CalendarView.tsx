import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import CalendarToolbar from '@/components/CalendarToolbar';
import ServicesPanel from '@/components/ServicesPanel';
import StylistHeader from '@/components/StylistHeader';
import TimeSlots from '@/components/TimeSlots';
import BottomToolbar from '@/components/BottomToolbar';
import BookingModal from '@/components/BookingModal';
import { Stylist, Appointment, Service, TimeSlot, ViewMode } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [showServices, setShowServices] = useState(false);
  
  const formattedDate = format(currentDate, "h:mma d MMMM yyyy");
  
  // Fetch stylists
  const { data: stylists = [] } = useQuery<Stylist[]>({
    queryKey: ['/api/stylists']
  });
  
  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services']
  });
  
  // Fetch appointments for the current date
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/appointments?date=${format(currentDate, 'yyyy-MM-dd')}`);
      return await res.json();
    }
  });
  
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
  
  const handlePreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };
  
  const handleNewBooking = (stylistId?: number, time?: string) => {
    if (stylistId) {
      const stylist = stylists.find(s => s.id === stylistId) || null;
      setSelectedStylist(stylist);
    }
    
    if (time) {
      setSelectedTimeSlot(time);
    }
    
    setIsBookingModalOpen(true);
  };
  
  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <CalendarToolbar 
        currentDate={formattedDate}
        viewMode={viewMode}
        onPrevious={handlePreviousDay}
        onNext={handleNextDay}
        onViewModeChange={setViewMode}
        onNewBooking={() => handleNewBooking()}
      />
      
      <div className="flex h-[calc(100vh-170px)] overflow-hidden">
        {/* Main calendar grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max">
            <StylistHeader stylists={stylists} />
            
            <TimeSlots 
              timeSlots={timeSlots}
              stylists={stylists}
              appointments={appointments}
              onTimeSlotClick={handleNewBooking}
            />
          </div>
        </div>
      </div>
      
      <BottomToolbar viewMode={viewMode} onViewModeChange={setViewMode} />
      
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        stylists={stylists}
        services={services}
        selectedDate={currentDate}
        selectedTimeSlot={selectedTimeSlot}
        selectedStylist={selectedStylist}
      />
    </div>
  );
}
