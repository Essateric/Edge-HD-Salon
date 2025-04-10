import React, { useState, useEffect } from 'react';

interface TimeSidebarProps {
  startHour?: number;
  endHour?: number;
}

export default function TimeSidebar({
  startHour = 9,
  endHour = 20, // 8pm
}: TimeSidebarProps) {
  const APPOINTMENT_HEIGHT = 21.1875; // height per 15 min (same as in TimeSlots)
  
  // Current time indicator position
  const [nowPosition, setNowPosition] = useState(0);
  
  // Update the current time indicator position
  useEffect(() => {
    const pixelsPerMinute = 1.4125;
    
    function updateNowLine() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;

      const topPosition = minutesSinceStart * pixelsPerMinute;
      setNowPosition(topPosition);
    }

    updateNowLine();
    const interval = setInterval(updateNowLine, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startHour]);
  
  // Generate time slots from startHour to endHour
  const renderTimeSlots = () => {
    const slots = [];
    
    // Empty header to align with stylist headers
    slots.push(
      <div key="header" className="text-center p-2 border-b border-border bg-background font-medium">
        
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
            paddingTop: '2px',
            color: '#ffffff'
          }}
        >
          {displayHour12}:00 {amPm}
        </div>
      );
      
      // 15-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-15`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + APPOINTMENT_HEIGHT}px`,
            paddingTop: '2px',
            color: '#ffffff'
          }}
        >
          {displayHour12}:15 {amPm}
        </div>
      );
      
      // 30-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-30`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + (APPOINTMENT_HEIGHT * 2)}px`,
            paddingTop: '2px',
            color: '#ffffff'
          }}
        >
          {displayHour12}:30 {amPm}
        </div>
      );
      
      // 45-minute marker
      slots.push(
        <div 
          key={`hour-${hour}-45`}
          className="border-b border-gray-200 px-2 text-right pr-4 text-xs"
          style={{ 
            height: `${APPOINTMENT_HEIGHT}px`,
            position: 'absolute',
            width: '100%',
            top: `${(hour - startHour) * 4 * APPOINTMENT_HEIGHT + (APPOINTMENT_HEIGHT * 3)}px`,
            paddingTop: '2px',
            color: '#ffffff'
          }}
        >
          {displayHour12}:45 {amPm}
        </div>
      );
    }
    
    return slots;
  };
  
  return (
    <div 
      id="times-container" 
      className="w-20 md:w-28 flex-shrink-0 border-r border-border bg-background sticky left-0 relative"
      style={{ height: 'calc(100vh - 200px)' }}
    >
      {/* Current time indicator in sidebar */}
      <div 
        className="absolute right-0 z-50 flex items-center" 
        style={{ top: `${nowPosition}px`, width: '100%' }}
      >
        <div className="flex w-full items-center justify-end">
          <div className="h-0.5 bg-red-600 w-4 mr-0"></div>
          <div className="w-2 h-2 rounded-full bg-red-600 mr-0"></div>
        </div>
      </div>
      
      {renderTimeSlots()}
    </div>
  );
}