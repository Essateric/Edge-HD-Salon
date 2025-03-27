export type Stylist = {
  id: number;
  name: string;
  imageUrl: string;
};

export type ServiceCategory = {
  id: number;
  name: string;
};

export type Service = {
  id: number;
  name: string;
  categoryId: number;
  defaultDuration: number; // in minutes
  price?: number;
};

export type StylistServiceDuration = {
  id: number;
  stylistId: number;
  serviceId: number;
  duration: number; // in minutes (can differ from default)
};

export type AppointmentService = {
  id: number;
  name: string;
  price?: number;
  duration: number;
};

export type Appointment = {
  id: number;
  customerId: number | null;
  customerName: string | null;
  stylistId: number;
  serviceId: number;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  isConsultation: boolean;
  status?: 'pending' | 'confirmed' | 'canceled' | 'completed';
  duration?: number; // in minutes
  cost?: number;
  services?: AppointmentService[]; // Multiple services for this appointment
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
};

export type TimeSlot = {
  time: string;
  hour: number;
  minute: number;
  formatted: string;
};

export type ViewMode = 'day' | 'week' | 'month';
