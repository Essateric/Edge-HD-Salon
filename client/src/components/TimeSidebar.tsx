import React from 'react';

interface TimeSidebarProps {
  startHour?: number;
  endHour?: number;
}

export default function TimeSidebar({
  startHour = 9,
  endHour = 20, // 8pm
}: TimeSidebarProps) {
  const APPOINTMENT_HEIGHT = 21.1875; // height per 15 min (same as in TimeSlots)
  
  // Generate time slots from startHour to endHour
  const renderTimeSlots = () => {
    const slots = [];
    
    // Empty header to align with stylist headers
    slots.push(
      <div key="header" className="text-center p-2 border-b border-border bg-background font-medium">
        Time
      </div>
    );
    
    // Create time markers for each hour and its 15-minute intervals
    for (let hour = startHour; hour <= endHour; hour++) {
      // Convert to 12-hour format
      const displayHour = hour > 12 ? hour - 12 : hour;
      const displayHour12 = hour === 12 ? 12 : displayHour;
      const amPm = hour >= 12 ? 'pm' : 'am';
      
      // Hour marker (00)
      slots.push(
        <div 
          key={`hour-${hour}-00`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-sm font-medium"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT}px`,
            paddingTop: '2px'
          }}
        >
          {displayHour12}:00 {amPm}
        </div>
      );
      
      // 15-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-15`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs text-gray-500"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + APPOINTMENT_HEIGHT}px`,
            paddingTop: '2px'
          }}
        >
          :15
        </div>
      );
      
      // 30-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-30`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs text-gray-500"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + (APPOINTMENT_HEIGHT * 2)}px`,
            paddingTop: '2px'
          }}
        >
          :30
        </div>
      );
      
      // 45-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-45`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs text-gray-500"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + (APPOINTMENT_HEIGHT * 3)}px`,
            paddingTop: '2px'
          }}
        >
          :45
        </div>
      );
    }
    
    return slots;
  };
  
  return (
    <div 
      id="times-container" 
      className="w-20 md:w-28 flex-shrink-0 border-r border-border bg-background sticky left-0 relative"
      style={{ height: '700px' }}
    >
      {renderTimeSlots()}
    </div>
  );
}