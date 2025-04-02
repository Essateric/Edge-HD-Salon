import React from 'react';

interface TimeSidebarProps {
  startHour?: number;
  endHour?: number;
  cellHeight?: number;
}

export default function TimeSidebar({
  startHour = 9,
  endHour = 20, // 8pm
  cellHeight = 21.1875
}: TimeSidebarProps) {
  // Generate time slots from startHour to endHour
  const renderTimeSlots = () => {
    const slots = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      // Convert to 12-hour format
      const displayHour = hour > 12 ? hour - 12 : hour;
      const amPm = hour >= 12 ? 'pm' : 'am';
      
      // Hour marker
      slots.push(
        <div 
          key={`hour-${hour}`}
          className="flex items-center justify-center text-sm text-gray-600"
          style={{ height: `${cellHeight}px` }}
        >
          {displayHour}:00 {amPm}
        </div>
      );
      
      // 15, 30, 45 minute markers
      [15, 30, 45].forEach(minute => {
        slots.push(
          <div 
            key={`hour-${hour}-${minute}`}
            className="flex items-center justify-center text-sm text-gray-400"
            style={{ height: `${cellHeight}px` }}
          >
            {minute}
          </div>
        );
      });
    }
    
    return slots;
  };
  
  return (
    <div id="times-container" className="flex flex-col w-[110px] border-r border-gray-300 bg-white">
      {renderTimeSlots()}
    </div>
  );
}