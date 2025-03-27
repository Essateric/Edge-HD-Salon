import { 
  Stylist, InsertStylist, 
  Service, InsertService, 
  Customer, InsertCustomer, 
  Appointment, InsertAppointment, 
  User, InsertUser 
} from "@shared/schema";
import { add, format, parse } from "date-fns";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stylist operations
  getAllStylists(): Promise<Stylist[]>;
  getStylist(id: number): Promise<Stylist | undefined>;
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  
  // Service operations
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServicesByCategory(category: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  
  // Appointment operations
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentsByStylist(stylistId: number): Promise<Appointment[]>;
  getAppointmentsByCustomer(customerId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stylists: Map<number, Stylist>;
  private services: Map<number, Service>;
  private customers: Map<number, Customer>;
  private appointments: Map<number, Appointment>;
  
  private currentUserId: number;
  private currentStylistId: number;
  private currentServiceId: number;
  private currentCustomerId: number;
  private currentAppointmentId: number;
  
  constructor() {
    this.users = new Map();
    this.stylists = new Map();
    this.services = new Map();
    this.customers = new Map();
    this.appointments = new Map();
    
    this.currentUserId = 1;
    this.currentStylistId = 1;
    this.currentServiceId = 1;
    this.currentCustomerId = 1;
    this.currentAppointmentId = 1;
    
    // Seed data
    this.seedData();
  }
  
  private seedData() {
    // Seed stylists
    const stylists: InsertStylist[] = [
      { name: "Martin", imageUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "Darren", imageUrl: "https://randomuser.me/api/portraits/men/76.jpg" },
      { name: "Annaliese", imageUrl: "https://randomuser.me/api/portraits/women/65.jpg" },
      { name: "Daisy", imageUrl: "https://randomuser.me/api/portraits/women/22.jpg" },
      { name: "Ryan", imageUrl: "https://randomuser.me/api/portraits/men/45.jpg" },
      { name: "Jasmine", imageUrl: "https://randomuser.me/api/portraits/women/33.jpg" }
    ];
    
    stylists.forEach(stylist => this.createStylist(stylist));
    
    // Seed services
    const serviceCategories = {
      "Cut & Finish": [
        { name: "Cut & Blow Dry", duration: 60 },
        { name: "Blow Dry", duration: 30 },
        { name: "Long Blow Dry", duration: 45 },
        { name: "Dry Cut", duration: 30 },
        { name: "Cut & Blow Dry (Long)", duration: 75 },
        { name: "Hair up", duration: 60 },
        { name: "Re-style", duration: 90 },
        { name: "Wet Cut", duration: 45 },
        { name: "Fringe Trim", duration: 15 }
      ],
      "Gents": [
        { name: "Gents Cut", duration: 30 },
        { name: "Gents Cut & Style", duration: 45 }
      ],
      "Highlights": [
        { name: "Full Highlights", duration: 120 },
        { name: "Half Head Highlights", duration: 90 },
        { name: "T-section Highlights", duration: 60 }
      ],
      "Tints": [
        { name: "Full Head Tint", duration: 90 },
        { name: "Root Tint", duration: 60 }
      ],
      "Treatments": [
        { name: "Deep Conditioning", duration: 30 },
        { name: "Scalp Treatment", duration: 45 },
        { name: "Keratin Treatment", duration: 120 }
      ]
    };
    
    Object.entries(serviceCategories).forEach(([category, services]) => {
      services.forEach(service => {
        this.createService({
          name: service.name,
          category,
          duration: service.duration
        });
      });
    });
    
    // Seed customers
    const customers: InsertCustomer[] = [
      { name: "Sasha Walker", phone: "555-123-4567", email: "sasha@example.com", notes: "" },
      { name: "Allison Holliday", phone: "555-234-5678", email: "allison@example.com", notes: "Prefers afternoon appointments" },
      { name: "Khad Akomi", phone: "555-345-6789", email: "khad@example.com", notes: "" },
      { name: "Maria Broadbent", phone: "555-456-7890", email: "maria@example.com", notes: "Allergic to certain hair products" },
      { name: "Sue Hewitt", phone: "555-567-8901", email: "sue@example.com", notes: "" },
      { name: "Natasha Denvers", phone: "555-678-9012", email: "natasha@example.com", notes: "New client" }
    ];
    
    customers.forEach(customer => this.createCustomer(customer));
    
    // Seed appointments
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');
    
    // Helper function to create appointments with proper start and end times based on duration
    const createAppt = (
      customerName: string, 
      stylistId: number, 
      serviceId: number, 
      serviceName: string, 
      startTime: string, 
      duration: number, 
      isConsultation: boolean = false
    ) => {
      const startDateTime = parse(startTime, 'h:mm a', new Date());
      const endDateTime = add(startDateTime, { minutes: duration });
      const endTime = format(endDateTime, 'h:mm a');
      
      this.createAppointment({
        customerName,
        customerId: null,
        stylistId,
        serviceId,
        serviceName,
        date: dateStr,
        startTime,
        endTime,
        notes: "",
        isConsultation
      });
    };
    
    // Create some appointments
    createAppt("Khad & Horia Kamri", 3, 1, "Waxing", "10:00 am", 60);
    createAppt("Sasha W", 1, 1, "Cut & Blow Dry", "11:00 am", 60);
    createAppt("Allison Holliday", 2, 1, "Cut & Blow Dry", "11:00 am", 60);
    createAppt("Khad & Sohrab Kohlawi", 3, 1, "Cut & Blow Dry", "11:00 am", 60);
    createAppt("Natasha D", 1, 18, "Consultation", "12:00 pm", 30, true);
    createAppt("Michaela H", 1, 4, "Dry Cut", "1:00 pm", 30);
    createAppt("Coralie Illingworth", 2, 12, "HG12 GKRTE Half Head", "1:00 pm", 90);
    createAppt("Khad Akomi", 3, 1, "Cut & Blow Dry", "1:00 pm", 60);
    createAppt("Sue Hewitt", 1, 1, "Cut & Blow Dry", "2:00 pm", 60);
    createAppt("Maria Broadbent", 3, 14, "Full Head Colour", "2:00 pm", 90);
    createAppt("Carolynn Illingworth", 1, 2, "Blow Dry", "3:00 pm", 30);
    createAppt("Naomi Ayres", 2, 1, "Cut & Blow Dry", "3:00 pm", 60);
    createAppt("Kerry Harris", 3, 4, "Dry Cut", "3:00 pm", 30);
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Stylist operations
  async getAllStylists(): Promise<Stylist[]> {
    return Array.from(this.stylists.values());
  }
  
  async getStylist(id: number): Promise<Stylist | undefined> {
    return this.stylists.get(id);
  }
  
  async createStylist(stylist: InsertStylist): Promise<Stylist> {
    const id = this.currentStylistId++;
    const newStylist: Stylist = { ...stylist, id };
    this.stylists.set(id, newStylist);
    return newStylist;
  }
  
  // Service operations
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async getServicesByCategory(category: string): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.category === category);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const newCustomer: Customer = { ...customer, id };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  // Appointment operations
  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }
  
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => appointment.date === date);
  }
  
  async getAppointmentsByStylist(stylistId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => appointment.stylistId === stylistId);
  }
  
  async getAppointmentsByCustomer(customerId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => appointment.customerId === customerId);
  }
  
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const id = this.currentAppointmentId++;
    
    // If a service ID is provided, get the service name
    let serviceName = appointmentData.serviceName;
    if (appointmentData.serviceId && !serviceName) {
      const service = await this.getService(appointmentData.serviceId);
      if (service) {
        serviceName = service.name;
      }
    }
    
    // Calculate end time based on start time and duration (if not provided)
    let endTime = appointmentData.endTime;
    if (!endTime && appointmentData.startTime) {
      const service = appointmentData.serviceId ? await this.getService(appointmentData.serviceId) : null;
      const duration = service?.duration || 30; // Default to 30 minutes
      
      const startDateTime = parse(appointmentData.startTime, 'h:mm a', new Date());
      const endDateTime = add(startDateTime, { minutes: duration });
      endTime = format(endDateTime, 'h:mm a');
    }
    
    const appointment: Appointment = { 
      ...appointmentData, 
      id,
      serviceName: serviceName || "Unnamed Service",
      endTime: endTime || appointmentData.startTime
    };
    
    this.appointments.set(id, appointment);
    return appointment;
  }
  
  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    // If a service ID is changed, update the service name
    let serviceName = appointmentData.serviceName;
    if (appointmentData.serviceId && appointmentData.serviceId !== appointment.serviceId) {
      const service = await this.getService(appointmentData.serviceId);
      if (service) {
        serviceName = service.name;
      }
    }
    
    // Update the appointment
    const updatedAppointment: Appointment = {
      ...appointment,
      ...appointmentData,
      serviceName: serviceName || appointment.serviceName
    };
    
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
}

export const storage = new MemStorage();
