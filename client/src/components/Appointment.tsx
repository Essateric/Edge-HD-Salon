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
    
    // Parse times to hours and minutes
    const [startHour, startMinute] = startTime.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [0, 0];
    const [endHour, endMinute] = endTime.match(/(\d+):(\d+)/)?.slice(1).map(Number) || [0, 0];
    
    // Calculate duration in minutes
    const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute);
    
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
      } text-white rounded shadow-md p-1 z-10 cursor-move`}
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
