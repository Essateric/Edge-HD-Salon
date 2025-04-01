import { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Appointment } from '@/lib/types';
import { ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';

interface AppointmentProps {
  appointment: Appointment;
  onEditAppointment?: (appointment: Appointment) => void;
  index?: number; // Added index prop for Draggable
}

export default function AppointmentComponent({ 
  appointment, 
  onEditAppointment,
  index = 0 // Default to 0 if not provided 
}: AppointmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sizeAdjustment, setSizeAdjustment] = useState(0); // in 15-minute increments
  
  // Calculate the height based on duration
  // Assuming each hour is 120px in height (30px per 15 min)
  const getHeight = () => {
    const startTime = appointment.startTime;
    const endTime = appointment.endTime;
    
    let startHour = 0, startMinute = 0, startPeriod = '';
    let endHour = 0, endMinute = 0, endPeriod = '';
    
    // Parse 12-hour format times (e.g., "1:00 pm")
    const match12Hr = /(\d+):(\d+)\s*(am|pm)/i;
    const startMatch12 = startTime.match(match12Hr);
    const endMatch12 = endTime.match(match12Hr);
    
    if (startMatch12 && endMatch12) {
      startHour = parseInt(startMatch12[1]);
      startMinute = parseInt(startMatch12[2]);
      startPeriod = startMatch12[3].toLowerCase();
      
      endHour = parseInt(endMatch12[1]);
      endMinute = parseInt(endMatch12[2]);
      endPeriod = endMatch12[3].toLowerCase();
      
      // Convert to 24-hour format
      if (startPeriod === 'pm' && startHour < 12) startHour += 12;
      if (startPeriod === 'am' && startHour === 12) startHour = 0;
      if (endPeriod === 'pm' && endHour < 12) endHour += 12;
      if (endPeriod === 'am' && endHour === 12) endHour = 0;
    } else {
      // Parse 24-hour format times (e.g., "13:00")
      const match24Hr = /(\d+):(\d+)/;
      const startMatch24 = startTime.match(match24Hr);
      const endMatch24 = endTime.match(match24Hr);
      
      if (startMatch24 && endMatch24) {
        startHour = parseInt(startMatch24[1]);
        startMinute = parseInt(startMatch24[2]);
        
        endHour = parseInt(endMatch24[1]);
        endMinute = parseInt(endMatch24[2]);
      } else {
        console.error("Failed to parse appointment time format", startTime, endTime);
        return 60; // Default minimum height
      }
    }
    
    // Calculate duration in minutes
    let durationInMinutes;
    
    // Handle cases where end time is on the next day
    if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
      durationInMinutes = ((24 + endHour) - startHour) * 60 + (endMinute - startMinute);
    } else {
      durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    }
    
    // Apply size adjustment (each increment is 15 minutes)
    const adjustedDuration = durationInMinutes + (sizeAdjustment * 15);
    
    // Convert to pixels (30px per 15 minutes)
    return Math.max(adjustedDuration * 30 / 15, 60); // Minimum height of 60px
  };
  
  // Get appointment status label
  const getStatusLabel = () => {
    if (appointment.status === 'confirmed') return 'CONF';
    if (appointment.status === 'canceled') return 'CANC';
    if (appointment.status === 'completed') return 'DONE';
    return 'REQ';
  };
  
  // Get status color
  const getStatusColorClass = () => {
    if (appointment.status === 'confirmed') return 'bg-green-600/30';
    if (appointment.status === 'canceled') return 'bg-red-600/30';
    if (appointment.status === 'completed') return 'bg-blue-600/30';
    return 'bg-white/20';
  };
  
  // Handle click to edit appointment
  const handleClick = (e: React.MouseEvent) => {
    if (onEditAppointment) {
      e.stopPropagation();
      onEditAppointment(appointment);
    }
  };

  // Handle size adjustment in 15-minute increments
  const adjustSize = (e: React.MouseEvent, increment: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSizeAdjustment(prev => Math.max(prev + increment, -2)); // Prevent making too small
    
    // Update the appointment end time based on the adjustment
    // Code would ideally call an API to update the appointment's duration
    // For now, we're just adjusting visually
  };
  
  // Toggle expanded view
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Log appointment data for debugging
  useEffect(() => {
    console.log(`Appointment ${appointment.id}`, {
      id: appointment.id,
      stylistId: appointment.stylistId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      customerName: appointment.customerName,
      serviceName: appointment.serviceName
    });
  }, [appointment.id, appointment.stylistId, appointment.startTime, appointment.endTime]);

  return (
    <Draggable 
      draggableId={`appointment-${appointment.id}`} 
      index={index} // Use the index parameter
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`appointment absolute top-0 left-0 right-0 mx-1 
            ${
              appointment.isConsultation 
                ? 'bg-gradient-to-br from-[#B08D57] via-[#8B734A] to-[#6A563B]' 
                : 'bg-gradient-to-br from-[#D4B78E] via-[#B08D57] to-[#8B734A]'
            } 
            text-white rounded shadow-md p-2 cursor-move transition-all
            ${snapshot.isDragging ? 'opacity-95 shadow-xl scale-105 z-[9999] border-2 border-solid border-amber-400' : 'opacity-85 hover:opacity-100 hover:shadow-lg'}
            ${isHovered && !snapshot.isDragging ? 'transform -translate-y-0.5' : ''}
          `}
          style={{ 
            height: `${getHeight()}px`,
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : '',
            // zIndex is now handled in the className to avoid conflicts
            transform: provided.draggableProps.style?.transform
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          <div className="text-sm font-medium mb-1 flex justify-between">
            <span className={`${getStatusColorClass()} px-1 rounded text-xs`}>
              {getStatusLabel()}
            </span>
            <span className="text-sm">{appointment.startTime} - {appointment.endTime}</span>
          </div>
          <div className="text-sm font-medium">
            {appointment.customerName || 'Unspecified'}
          </div>
          
          {/* Service name with prominent display */}
          <div className="text-xs mt-1 font-semibold bg-white/30 px-2 py-1 rounded-md shadow-inner border border-white/20">
            {appointment.services && appointment.services.length > 0 ? (
              <>
                {/* Show first service by default */}
                <div className="flex justify-between">
                  <span>{appointment.services[0].name}</span>
                  {appointment.services.length > 1 && (
                    <span className="text-[10px] bg-white/20 px-1 rounded">{appointment.services.length} services</span>
                  )}
                </div>
              </>
            ) : (
              appointment.serviceName || 'No service specified'
            )}
          </div>
          
          {/* Always show key details */}
          <div className="text-xs mt-1 flex justify-between items-center">
            <div>{appointment.duration || '0'} mins</div>
            <div>{appointment.cost ? `£${appointment.cost}` : '£0'}</div>
          </div>
          
          {/* Expand/collapse button */}
          <div 
            className="absolute bottom-1 right-1 flex space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
              onClick={toggleExpanded}
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          
          {/* Size adjustment controls when expanded */}
          {isExpanded && (
            <div className="absolute top-1 right-1 flex flex-col space-y-1" onClick={(e) => e.stopPropagation()}>
              <button
                className="p-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
                onClick={(e) => adjustSize(e, 1)}
              >
                <Plus size={12} />
              </button>
              <button
                className="p-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
                onClick={(e) => adjustSize(e, -1)}
              >
                <Minus size={12} />
              </button>
            </div>
          )}
          
          {/* Show additional details when expanded */}
          {isExpanded && (
            <div className="text-xs mt-2 pt-1 border-t border-white/20">
              <div className="font-semibold mb-1">Service Details:</div>
              {appointment.services && appointment.services.length > 0 ? (
                <div className="ml-1 space-y-1">
                  {appointment.services.map((service, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{service.name}</span>
                      <span>£{service.price || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-1">{appointment.serviceName}</div>
              )}
              
              {appointment.notes && (
                <>
                  <div className="font-semibold mt-1 mb-1">Notes:</div>
                  <div className="ml-1">{appointment.notes}</div>
                </>
              )}
            </div>
          )}
          
          {/* Show notes on hover when not expanded */}
          {isHovered && !isExpanded && appointment.notes && (
            <div className="text-xs mt-1 pt-1 border-t border-white/20">
              <div className="truncate">{appointment.notes}</div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}