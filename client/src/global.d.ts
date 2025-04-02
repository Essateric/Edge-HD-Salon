import { Appointment } from '@/lib/types';

declare global {
  interface Window {
    lastMovedAppointment: Appointment | undefined;
  }
}

export {};