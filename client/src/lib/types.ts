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
};

export type StylistServiceDuration = {
  id: number;
  stylistId: number;
  serviceId: number;
  duration: number; // in minutes (can differ from default)
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
