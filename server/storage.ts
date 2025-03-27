import { 
  Stylist, InsertStylist, 
  ServiceCategory, InsertServiceCategory,
  Service, InsertService, 
  StylistServiceDuration, InsertStylistServiceDuration,
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
  updateStylist(id: number, stylist: Partial<InsertStylist>): Promise<Stylist | undefined>;
  deleteStylist(id: number): Promise<boolean>;
  
  // Service Category operations
  getAllServiceCategories(): Promise<ServiceCategory[]>;
  getServiceCategory(id: number): Promise<ServiceCategory | undefined>;
  createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined>;
  deleteServiceCategory(id: number): Promise<boolean>;
  
  // Service operations
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServicesByCategory(categoryId: number): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Stylist Service Duration operations
  getAllStylistServiceDurations(): Promise<StylistServiceDuration[]>;
  getStylistServiceDuration(id: number): Promise<StylistServiceDuration | undefined>;
  getStylistServiceDurationsByStylist(stylistId: number): Promise<StylistServiceDuration[]>;
  getStylistServiceDurationByServiceAndStylist(serviceId: number, stylistId: number): Promise<StylistServiceDuration | undefined>;
  createStylistServiceDuration(duration: InsertStylistServiceDuration): Promise<StylistServiceDuration>;
  updateStylistServiceDuration(id: number, duration: Partial<InsertStylistServiceDuration>): Promise<StylistServiceDuration | undefined>;
  deleteStylistServiceDuration(id: number): Promise<boolean>;
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
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
  private serviceCategories: Map<number, ServiceCategory>;
  private services: Map<number, Service>;
  private stylistServiceDurations: Map<number, StylistServiceDuration>;
  private customers: Map<number, Customer>;
  private appointments: Map<number, Appointment>;
  
  private currentUserId: number;
  private currentStylistId: number;
  private currentServiceCategoryId: number;
  private currentServiceId: number;
  private currentStylistServiceDurationId: number;
  private currentCustomerId: number;
  private currentAppointmentId: number;
  
  constructor() {
    this.users = new Map();
    this.stylists = new Map();
    this.serviceCategories = new Map();
    this.services = new Map();
    this.stylistServiceDurations = new Map();
    this.customers = new Map();
    this.appointments = new Map();
    
    this.currentUserId = 1;
    this.currentStylistId = 1;
    this.currentServiceCategoryId = 1;
    this.currentServiceId = 1;
    this.currentStylistServiceDurationId = 1;
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
    
    // Seed service categories
    const categories = [
      "Cut & Finish",
      "Gents",
      "Highlights",
      "Tints",
      "Treatments",
      "Waves"
    ];
    
    // Create categories and store their IDs
    const categoryIds: Record<string, number> = {};
    categories.forEach(categoryName => {
      this.createServiceCategory({ name: categoryName })
        .then(category => {
          categoryIds[categoryName] = category.id;
        });
    });
    
    // Seed services
    const serviceData = {
      "Cut & Finish": [
        { name: "Cut & Blow Dry", defaultDuration: 60 },
        { name: "Blow Dry", defaultDuration: 30 },
        { name: "Long Blow Dry", defaultDuration: 45 },
        { name: "Dry Cut", defaultDuration: 30 },
        { name: "Cut & Blow Dry (Long)", defaultDuration: 75 },
        { name: "Hair up", defaultDuration: 60 },
        { name: "Re-style", defaultDuration: 90 },
        { name: "Wet Cut", defaultDuration: 45 },
        { name: "Fringe Trim", defaultDuration: 15 }
      ],
      "Gents": [
        { name: "Gents Wet", defaultDuration: 30 },
        { name: "Gents Cut & Blow Dry", defaultDuration: 45 },
        { name: "Dry cut", defaultDuration: 30 },
        { name: "Re-style", defaultDuration: 60 }
      ],
      "Highlights": [
        { name: "HIGHLIGHTS FULL HEAD", defaultDuration: 120 },
        { name: "Balayage (ends lifted)", defaultDuration: 90 },
        { name: "Balayage (roots/ends)", defaultDuration: 120 },
        { name: "Colour Correction", defaultDuration: 180 },
        { name: "Fashion Colours", defaultDuration: 120 },
        { name: "HIGHLIGHTS Half Head", defaultDuration: 90 },
        { name: "HIGHLIGHTS parting", defaultDuration: 60 },
        { name: "Pre-lightener & Toner", defaultDuration: 90 },
        { name: "toner", defaultDuration: 30 }
      ],
      "Tints": [
        { name: "colour touch", defaultDuration: 45 },
        { name: "Tint Regrowth", defaultDuration: 60 },
        { name: "Full Head Colour", defaultDuration: 90 },
        { name: "T Section (Parting Roots)", defaultDuration: 45 },
        { name: "Extra tube", defaultDuration: 15 },
        { name: "Consultation", defaultDuration: 30 }
      ],
      "Treatments": [
        { name: "Hair Straightening", defaultDuration: 120 },
        { name: "Hair Treatments", defaultDuration: 45 },
        { name: "Olaplex", defaultDuration: 60 }
      ],
      "Waves": [
        { name: "Permanent Waving", defaultDuration: 120 }
      ]
    };
    
    // Wait for categories to be created first
    setTimeout(() => {
      Object.entries(serviceData).forEach(([categoryName, services]) => {
        if (categoryIds[categoryName]) {
          services.forEach(service => {
            this.createService({
              name: service.name,
              categoryId: categoryIds[categoryName],
              defaultDuration: service.defaultDuration
            });
          });
        }
      });
      
      // Set up some stylist-specific service durations (faster/slower for different stylists)
      setTimeout(() => {
        // Make Martin faster at cuts
        this.getStylistServiceDurationsByStylist(1).then(() => {
          this.getService(1).then(service => { // Cut & Blow Dry
            if (service) {
              this.createStylistServiceDuration({
                stylistId: 1,
                serviceId: service.id,
                duration: 45 // 15 minutes faster than default
              });
            }
          });
        });
        
        // Make Annaliese specialized in highlights
        this.getService(10).then(service => { // Full Highlights
          if (service) {
            this.createStylistServiceDuration({
              stylistId: 3,
              serviceId: service.id,
              duration: 100 // 20 minutes faster than default
            });
          }
        });
      }, 100);
    }, 100);
    
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
  
  // Stylist operations
  async updateStylist(id: number, stylist: Partial<InsertStylist>): Promise<Stylist | undefined> {
    const existingStylist = this.stylists.get(id);
    if (!existingStylist) return undefined;
    
    const updatedStylist: Stylist = { ...existingStylist, ...stylist };
    this.stylists.set(id, updatedStylist);
    return updatedStylist;
  }
  
  async deleteStylist(id: number): Promise<boolean> {
    return this.stylists.delete(id);
  }
  
  // Service Category operations
  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return Array.from(this.serviceCategories.values());
  }
  
  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    return this.serviceCategories.get(id);
  }
  
  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const id = this.currentServiceCategoryId++;
    const newCategory: ServiceCategory = { ...category, id };
    this.serviceCategories.set(id, newCategory);
    return newCategory;
  }
  
  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
    const existingCategory = this.serviceCategories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory: ServiceCategory = { ...existingCategory, ...category };
    this.serviceCategories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteServiceCategory(id: number): Promise<boolean> {
    return this.serviceCategories.delete(id);
  }
  
  // Service operations
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async getServicesByCategory(categoryId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(service => service.categoryId === categoryId);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const newService: Service = { ...service, id };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService: Service = { ...existingService, ...service };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }
  
  // Stylist Service Duration operations
  async getAllStylistServiceDurations(): Promise<StylistServiceDuration[]> {
    return Array.from(this.stylistServiceDurations.values());
  }
  
  async getStylistServiceDuration(id: number): Promise<StylistServiceDuration | undefined> {
    return this.stylistServiceDurations.get(id);
  }
  
  async getStylistServiceDurationsByStylist(stylistId: number): Promise<StylistServiceDuration[]> {
    return Array.from(this.stylistServiceDurations.values())
      .filter(duration => duration.stylistId === stylistId);
  }
  
  async getStylistServiceDurationByServiceAndStylist(serviceId: number, stylistId: number): Promise<StylistServiceDuration | undefined> {
    return Array.from(this.stylistServiceDurations.values())
      .find(duration => duration.serviceId === serviceId && duration.stylistId === stylistId);
  }
  
  async createStylistServiceDuration(duration: InsertStylistServiceDuration): Promise<StylistServiceDuration> {
    const id = this.currentStylistServiceDurationId++;
    const newDuration: StylistServiceDuration = { ...duration, id };
    this.stylistServiceDurations.set(id, newDuration);
    return newDuration;
  }
  
  async updateStylistServiceDuration(id: number, duration: Partial<InsertStylistServiceDuration>): Promise<StylistServiceDuration | undefined> {
    const existingDuration = this.stylistServiceDurations.get(id);
    if (!existingDuration) return undefined;
    
    const updatedDuration: StylistServiceDuration = { ...existingDuration, ...duration };
    this.stylistServiceDurations.set(id, updatedDuration);
    return updatedDuration;
  }
  
  async deleteStylistServiceDuration(id: number): Promise<boolean> {
    return this.stylistServiceDurations.delete(id);
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
    // Ensure all fields have at least null values
    const newCustomer: Customer = { 
      id, 
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone || null,
      notes: customer.notes || null
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer: Customer = { ...existingCustomer, ...customer };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
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
    
    // Use the provided endTime or calculate it based on start time and duration
    let endTime = appointmentData.endTime;
    if ((!endTime || endTime === '') && appointmentData.startTime) {
      // Get service duration from the appointment data or the service
      let duration = appointmentData.duration || 30; // Use provided duration or default to 30 minutes
      
      if (!appointmentData.duration && appointmentData.serviceId && appointmentData.stylistId) {
        // If no duration was provided, check for stylist-specific duration
        const stylistDuration = await this.getStylistServiceDurationByServiceAndStylist(
          appointmentData.serviceId, 
          appointmentData.stylistId
        );
        
        if (stylistDuration) {
          duration = stylistDuration.duration;
        } else {
          // If no stylist-specific duration, use service default duration
          const service = await this.getService(appointmentData.serviceId);
          if (service) {
            duration = service.defaultDuration;
          }
        }
      }
      
      // Parse the startTime (handling both HH:MM and h:mm a formats)
      let startDateTime: Date;
      if (appointmentData.startTime.includes(':') && !appointmentData.startTime.includes(' ')) {
        // Format is HH:MM (24-hour)
        const [hours, minutes] = appointmentData.startTime.split(':').map(Number);
        startDateTime = new Date();
        startDateTime.setHours(hours, minutes, 0, 0);
      } else {
        // Format is h:mm a (12-hour with AM/PM)
        startDateTime = parse(appointmentData.startTime, 'h:mm a', new Date());
      }
      
      const endDateTime = add(startDateTime, { minutes: duration });
      endTime = format(endDateTime, 'HH:mm'); // Use 24-hour format for consistency
    }
    
    // Ensure all required fields have values, even if null
    const appointment: Appointment = { 
      id,
      date: appointmentData.date,
      stylistId: appointmentData.stylistId,
      serviceId: appointmentData.serviceId,
      serviceName: serviceName || "Unnamed Service",
      startTime: appointmentData.startTime,
      endTime: endTime || appointmentData.startTime,
      notes: appointmentData.notes || null,
      customerId: appointmentData.customerId || null,
      customerName: appointmentData.customerName || null,
      isConsultation: appointmentData.isConsultation || null,
      createdAt: new Date()
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
