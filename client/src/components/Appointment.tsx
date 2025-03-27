import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Appointment } from '@/lib/types';

interface AppointmentProps {
  appointment: Appointment;
}

export default function AppointmentComponent({ appointment }: AppointmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Configure draggable
  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id: `appointment-${appointment.id}`,
    data: appointment,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 1 : undefined,
    boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.4)' : undefined,
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
  
  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`appointment absolute top-0 left-0 right-0 mx-1 ${
        appointment.isConsultation ? 'bg-[#8B734A]' : 'bg-[#B08D57]/90'
      } text-white rounded shadow-md p-1 z-10 cursor-move`}
      style={{ 
        height: `${getHeight()}px`,
        ...style
      }}
      initial={{ opacity: 0.8 }}
      animate={{ 
        opacity: isHovered ? 1 : 0.9,
        y: isHovered ? -2 : 0,
      }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-xs font-medium mb-1 flex justify-between">
        <span>REQ</span>
        <span className="text-xs opacity-80">{appointment.startTime} - {appointment.endTime}</span>
      </div>
      <div className="text-xs font-medium line-clamp-2">
        {appointment.customerName || 'Unspecified'} - {appointment.serviceName}
      </div>
    </motion.div>
  );
}
