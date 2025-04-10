import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleStylistViewProps {
  onAppointmentClick?: (appointment: any) => void;
}

const SimpleStylistView: React.FC<SimpleStylistViewProps> = ({ 
  onAppointmentClick
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  
  // Stylist data
  const stylists = [
    { id: 1, name: "Martin" },
    { id: 2, name: "Darren" },
    { id: 3, name: "Annaliese" }
  ];
  
  // Time slots (15 minute increments)
  interface TimeSlot {
    hour: number;
    minute: number;
    display: string;
  }
  
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({
        hour,
        minute,
        display: `${hour}:${minute === 0 ? '00' : minute} ${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
  }
  
  // Sample appointments (hardcoded for demonstration)
  const appointments = [
    {
      id: 1,
      stylistId: 1,
      customerName: "Jane Smith",
      serviceName: "Cut & Blow Dry",
      startTime: { hour: 10, minute: 0 },
      endTime: { hour: 11, minute: 0 },
      color: "rgba(212, 183, 142, 0.9)",
    },
    {
      id: 2,
      stylistId: 2,
      customerName: "John Doe",
      serviceName: "Beard Trim",
      startTime: { hour: 11, minute: 15 },
      endTime: { hour: 11, minute: 45 },
      color: "rgba(139, 115, 74, 0.9)",
    },
    {
      id: 3,
      stylistId: 3,
      customerName: "Alice Johnson",
      serviceName: "Full Colour",
      startTime: { hour: 14, minute: 0 },
      endTime: { hour: 16, minute: 0 },
      color: "rgba(164, 132, 85, 0.9)",
    }
  ];
  
  // Navigate to previous day/week
  const goToPrevious = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'day') {
      prev.setDate(prev.getDate() - 1);
    } else {
      prev.setDate(prev.getDate() - 7);
    }
    setCurrentDate(prev);
  };
  
  // Navigate to next day/week
  const goToNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setCurrentDate(next);
  };
  
  // Get array of dates for week view
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    // Set to first day of the week (Sunday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle appointment click
  const handleAppointmentClick = (appointment: any) => {
    if (onAppointmentClick) {
      onAppointmentClick(appointment);
    }
  };
  
  // Check if appointment is within this time slot
  const getAppointmentForSlot = (stylistId: number, hour: number, minute: number) => {
    return appointments.find(appointment => 
      appointment.stylistId === stylistId &&
      isTimeInRange(hour, minute, appointment.startTime, appointment.endTime)
    );
  };
  
  // Helper to check if a time is within a range
  const isTimeInRange = (hour: number, minute: number, startTime: {hour: number, minute: number}, endTime: {hour: number, minute: number}) => {
    const totalMinutes = hour * 60 + minute;
    const startTotalMinutes = startTime.hour * 60 + startTime.minute;
    const endTotalMinutes = endTime.hour * 60 + endTime.minute;
    
    return totalMinutes >= startTotalMinutes && totalMinutes < endTotalMinutes;
  };
  
  // Calculate appointment height and position
  const getAppointmentStyle = (appointment: any) => {
    const startTotalMinutes = appointment.startTime.hour * 60 + appointment.startTime.minute;
    const endTotalMinutes = appointment.endTime.hour * 60 + appointment.endTime.minute;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // Each 15 minutes is 30px height
    const height = durationMinutes / 15 * 30;
    
    return {
      backgroundColor: appointment.color,
      height: `${height}px`,
      overflow: 'hidden'
    };
  };
  
  return (
    <div className="h-full bg-white rounded-md shadow-sm p-4 border border-muted overflow-auto flex flex-col">
      {/* Calendar controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={goToPrevious}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={goToToday}
            className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Today
          </button>
          <button 
            onClick={goToNext}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="text-lg font-semibold">
          {viewMode === 'day' 
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : (() => {
                const weekDates = getWeekDates();
                return `${format(weekDates[0], 'MMM d')} - ${format(weekDates[6], 'MMM d, yyyy')}`;
              })()
          }
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('day')}
            className={cn(
              "px-3 py-2 rounded-md",
              viewMode === 'day' 
                ? "bg-gradient-to-r from-[#D4B78E] to-[#8B734A] text-white" 
                : "border border-gray-300 hover:bg-gray-100"
            )}
          >
            Day View
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={cn(
              "px-3 py-2 rounded-md",
              viewMode === 'week' 
                ? "bg-gradient-to-r from-[#D4B78E] to-[#8B734A] text-white" 
                : "border border-gray-300 hover:bg-gray-100"
            )}
          >
            Week View
          </button>
        </div>
      </div>
      
      {/* Main calendar grid */}
      <div className="flex flex-grow overflow-auto border-t border-gray-200">
        {/* Time column */}
        <div className="w-20 flex-shrink-0 border-r border-gray-200">
          <div className="h-10 border-b border-gray-200"></div>
          {timeSlots.map((slot, index) => (
            <div 
              key={`time-${index}`} 
              className={cn(
                "h-[30px] px-2 text-xs flex items-center justify-end",
                slot.minute === 0 ? "font-semibold" : ""
              )}
            >
              {slot.minute === 0 && (
                <span>{`${slot.hour % 12 || 12} ${slot.hour >= 12 ? 'PM' : 'AM'}`}</span>
              )}
            </div>
          ))}
        </div>
        
        {viewMode === 'day' ? (
          /* Day view - Stylist columns */
          <div className="flex flex-grow">
            {stylists.map(stylist => (
              <div key={stylist.id} className="flex-1 min-w-[200px] border-r border-gray-200">
                {/* Stylist header */}
                <div className="h-10 bg-gradient-to-r from-[#D4B78E] to-[#8B734A] text-white flex items-center justify-center font-semibold sticky top-0">
                  {stylist.name}
                </div>
                
                {/* Time slots */}
                {timeSlots.map((slot, index) => {
                  const appointment = getAppointmentForSlot(stylist.id, slot.hour, slot.minute);
                  return (
                    <div 
                      key={`slot-${stylist.id}-${index}`}
                      className={cn(
                        "h-[30px] border-b border-gray-100",
                        slot.minute === 0 ? "border-b border-gray-300" : ""
                      )}
                    >
                      {/* Render appointment if it starts at this time slot */}
                      {appointment && slot.hour === appointment.startTime.hour && slot.minute === appointment.startTime.minute && (
                        <div 
                          className="p-1 rounded-sm text-xs cursor-pointer"
                          style={getAppointmentStyle(appointment)}
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="font-semibold">{appointment.customerName}</div>
                          <div>{appointment.serviceName}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          /* Week view - Day columns with stylists */
          <div className="flex flex-grow">
            {getWeekDates().map((date, dateIndex) => (
              <div key={dateIndex} className="flex-1 min-w-[180px] border-r border-gray-200">
                {/* Date header */}
                <div className="h-10 bg-gradient-to-r from-[#D4B78E] to-[#8B734A] text-white flex flex-col items-center justify-center font-semibold sticky top-0">
                  <div>{format(date, 'EEE')}</div>
                  <div className="text-xs">{format(date, 'MMM d')}</div>
                </div>
                
                {/* Stylist sub-columns */}
                <div className="flex">
                  {stylists.map(stylist => (
                    <div key={`day-${dateIndex}-stylist-${stylist.id}`} className="flex-1 min-w-[60px] relative">
                      {/* Stylist sub-header */}
                      <div className="h-8 text-xs border-b border-gray-300 flex items-center justify-center bg-gray-50 font-medium">
                        {stylist.name}
                      </div>
                      
                      {/* Time slots in week view (condensed) */}
                      {timeSlots.map((slot, index) => (
                        <div 
                          key={`week-slot-${dateIndex}-${stylist.id}-${index}`}
                          className={cn(
                            "h-[30px] border-b border-gray-100",
                            slot.minute === 0 ? "border-b border-gray-300" : ""
                          )}
                        >
                          {/* Sample appointment rendering for week view - this would need real date check logic */}
                          {index === dateIndex * 4 && stylist.id === (dateIndex % 3) + 1 && (
                            <div 
                              className="p-1 rounded-sm text-xs cursor-pointer"
                              style={{ backgroundColor: "rgba(212, 183, 142, 0.9)", height: "60px", overflow: "hidden" }}
                              onClick={() => handleAppointmentClick({
                                customerName: "Week View Demo",
                                serviceName: "Sample Service"
                              })}
                            >
                              <div className="font-semibold">Sample</div>
                              <div>Appointment</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleStylistView;