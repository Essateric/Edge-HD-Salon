import React from 'react';

interface TimeSidebarProps {
  startHour?: number;
  endHour?: number;
}

export default function TimeSidebar({
  startHour = 9,
  endHour = 20, // 8pm
}: TimeSidebarProps) {
  // Generate time slots from startHour to endHour
  const renderTimeSlots = () => {
    const slots = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      // Convert to 12-hour format
      const displayHour = hour > 12 ? hour - 12 : hour;
      const amPm = hour >= 12 ? 'pm' : 'am';
      
      // Each hour block with 15-minute segments
      slots.push(
        <div 
          key={`hour-${hour}`} 
          className="time-slot relative" 
          style={{ minHeight: '84.75px' }}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="font-medium flex justify-end items-center gap-1">
              {displayHour}:00 {amPm}
              <div className="w-3 h-0.5 bg-muted-foreground/50"></div>
            </div>
            <div className="flex justify-end items-center gap-1">
              <span className="text-xs">15</span>
              <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
            </div>
            <div className="flex justify-end items-center gap-1">
              <span className="text-xs">30</span>
              <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
            </div>
            <div className="flex justify-end items-center gap-1">
              <span className="text-xs">45</span>
              <div className="w-2 h-0.5 bg-muted-foreground/30"></div>
            </div>
          </div>
        </div>
      );
    }
    
    return slots;
  };
  
  return (
    <div id="times-container" className="w-20 md:w-28 flex-shrink-0 border-r border-border bg-background sticky left-0">
      {renderTimeSlots()}
    </div>
  );
}