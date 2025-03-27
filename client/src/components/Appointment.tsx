import { useState } from 'react';
import { motion } from 'framer-motion';
import { Draggable } from 'react-beautiful-dnd';
import { Appointment } from '@/lib/types';

interface AppointmentProps {
  appointment: Appointment;
  onEditAppointment?: (appointment: Appointment) => void;
}

export default function AppointmentComponent({ 
  appointment, 
  onEditAppointment 
}: AppointmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
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
    
    // Convert to pixels (30px per 15 minutes)
    return Math.max(durationInMinutes * 30 / 15, 60); // Minimum height of 60px
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
  
  return (
    <Draggable 
      draggableId={`appointment-${appointment.id}`} 
      index={appointment.id}
    >
      {(provided, snapshot) => (
        <motion.div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`appointment absolute top-0 left-0 right-0 mx-1 ${
            appointment.isConsultation 
              ? 'bg-gradient-to-br from-[#B08D57] via-[#8B734A] to-[#6A563B]' 
              : 'bg-gradient-to-br from-[#D4B78E] via-[#B08D57] to-[#8B734A]'
          } text-white rounded shadow-md p-2 cursor-move`}
          style={{ 
            height: `${getHeight()}px`,
            ...provided.draggableProps.style
          }}
          initial={{ opacity: 0.8 }}
          animate={{ 
            opacity: snapshot.isDragging ? 0.9 : (isHovered ? 1 : 0.9),
            scale: snapshot.isDragging ? 1.03 : (isHovered ? 1.01 : 1),
            y: isHovered && !snapshot.isDragging ? -2 : 0,
          }}
          transition={{ 
            duration: snapshot.isDragging ? 0.01 : 0.2,
            ease: snapshot.isDragging ? "linear" : "easeInOut"
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
          <div className="text-xs mt-1 line-clamp-2 font-light">
            {appointment.serviceName}
          </div>
          {isHovered && (
            <div className="text-xs mt-1 pt-1 border-t border-white/20">
              {appointment.notes && <div className="truncate">{appointment.notes}</div>}
              <div>Duration: {appointment.duration || 'N/A'} {appointment.duration ? 'mins' : ''}</div>
              <div>Cost: {appointment.cost ? `£${appointment.cost}` : 'N/A'}</div>
            </div>
          )}
        </motion.div>
      )}
    </Draggable>
  );
}