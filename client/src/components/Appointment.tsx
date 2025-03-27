import { useState } from 'react';
import { motion } from 'framer-motion';
import { Appointment } from '@/lib/types';

interface AppointmentProps {
  appointment: Appointment;
}

export default function AppointmentComponent({ appointment }: AppointmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  
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
      className={`appointment absolute top-0 left-0 right-0 mx-1 ${
        appointment.isConsultation ? 'bg-amber-500' : 'bg-green-500'
      } text-white rounded shadow-sm p-1 z-10`}
      style={{ 
        height: `${getHeight()}px` 
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
      <div className="text-xs font-medium mb-1">REQ</div>
      <div className="text-xs font-medium">
        {appointment.customerName || 'Unspecified'} - {appointment.serviceName}
      </div>
    </motion.div>
  );
}
