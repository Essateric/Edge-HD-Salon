import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  
  // Configure draggable with improved settings
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: `appointment-${appointment.id}`,
    data: appointment,
  });

  // Enhanced style with better drag visualization
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : 10,
    opacity: isDragging ? 0.9 : undefined,
    boxShadow: isDragging ? '0 12px 20px -5px rgba(0, 0, 0, 0.5)' : undefined,
    transition: !isDragging ? 'box-shadow 0.2s, opacity 0.2s, transform 0.05s' : undefined,
    touchAction: 'none' // Better touch support
  };
  
  // Calculate the height based on duration
  // Assuming each hour is 48px in height (12px per 15 min)
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
        return 48; // Default minimum height
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
    
    // Convert to pixels (12px per 15 minutes)
    return Math.max(durationInMinutes * 12 / 15, 48); // Minimum height of 48px
  };
  
  // Handle click to edit appointment
  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && onEditAppointment) {
      e.stopPropagation();
      onEditAppointment(appointment);
    }
  };
  
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`appointment absolute top-0 left-0 right-0 mx-1 ${
        appointment.isConsultation 
          ? 'bg-gradient-to-br from-[#B08D57] via-[#8B734A] to-[#6A563B]' 
          : 'bg-gradient-to-br from-[#D4B78E] via-[#B08D57] to-[#8B734A]'
      } text-white rounded shadow-md p-1 cursor-move`}
      style={{ 
        height: `${getHeight()}px`,
        ...style
      }}
      initial={{ opacity: 0.8 }}
      animate={{ 
        opacity: isDragging ? 0.9 : (isHovered ? 1 : 0.9),
        scale: isDragging ? 1.03 : (isHovered ? 1.01 : 1),
        y: isHovered && !isDragging ? -2 : 0,
      }}
      transition={{ 
        duration: isDragging ? 0.01 : 0.2,
        ease: isDragging ? "linear" : "easeInOut"
      }}
      whileDrag={{
        scale: 1.05,
        zIndex: 1000,
        boxShadow: '0 14px 28px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="text-xs font-medium mb-1 flex justify-between">
        <span className="bg-white/20 px-1 rounded text-[0.65rem]">
          REQ
        </span>
        <span className="text-xs opacity-80">{appointment.startTime} - {appointment.endTime}</span>
      </div>
      <div className="text-xs font-medium line-clamp-2">
        {appointment.customerName || 'Unspecified'} - {appointment.serviceName}
      </div>
    </motion.div>
  );
}
