import { 
  Stylist, InsertStylist, 
  ServiceCategory, InsertServiceCategory,
  Service, InsertService, 
  StylistServiceDuration, InsertStylistServiceDuration,
  Customer, InsertCustomer, 
  Appointment, InsertAppointment, 
  User, InsertUser,
  Role, InsertRole,
  Permission, InsertPermission,
  RolePermission, InsertRolePermission,
  StylistSchedule, InsertStylistSchedule,
  users, roles, permissions, rolePermissions, stylists, 
  serviceCategories, services, stylistServiceDurations,
  customers, appointments, stylistSchedules
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password if provided plaintext
    if (user.password && !user.password.startsWith('$2a$')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if provided plaintext
    if (user.password && !user.password.startsWith('$2a$')) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true; // In PostgreSQL with Drizzle, successful deletion returns empty result
  }

  // Role operations
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(role)
      .where(eq(roles.id, id))
      .returning();
    
    return updatedRole || undefined;
  }

  async deleteRole(id: number): Promise<boolean> {
    await db.delete(roles).where(eq(roles.id, id));
    return true;
  }

  // Permission operations
  async getAllPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getPermissionByName(name: string): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.name, name));
    return permission || undefined;
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async updatePermission(id: number, permission: Partial<InsertPermission>): Promise<Permission | undefined> {
    const [updatedPermission] = await db
      .update(permissions)
      .set(permission)
      .where(eq(permissions.id, id))
      .returning();
    
    return updatedPermission || undefined;
  }

  async deletePermission(id: number): Promise<boolean> {
    await db.delete(permissions).where(eq(permissions.id, id));
    return true;
  }

  // Role-Permission operations
  async getAllRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions);
  }

  async getRolePermissionsByRole(roleId: number): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const rolePerms = await this.getRolePermissionsByRole(user.roleId);
    if (rolePerms.length === 0) return [];
    
    const permissionIds = rolePerms.map(rp => rp.permissionId);
    return await db.select().from(permissions).where(inArray(permissions.id, permissionIds));
  }

  async assignPermissionToRole(rolePermission: InsertRolePermission): Promise<RolePermission> {
    const [newRolePermission] = await db.insert(rolePermissions).values(rolePermission).returning();
    return newRolePermission;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );
    
    return true;
  }

  // Stylist operations
  async getAllStylists(): Promise<Stylist[]> {
    return await db.select().from(stylists);
  }

  async getStylist(id: number): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist || undefined;
  }

  async createStylist(stylist: InsertStylist): Promise<Stylist> {
    const [newStylist] = await db.insert(stylists).values(stylist).returning();
    return newStylist;
  }

  async updateStylist(id: number, stylist: Partial<InsertStylist>): Promise<Stylist | undefined> {
    const [updatedStylist] = await db
      .update(stylists)
      .set(stylist)
      .where(eq(stylists.id, id))
      .returning();
    
    return updatedStylist || undefined;
  }

  async deleteStylist(id: number): Promise<boolean> {
    await db.delete(stylists).where(eq(stylists.id, id));
    return true;
  }

  // Service Category operations
  async getAllServiceCategories(): Promise<ServiceCategory[]> {
    return await db.select().from(serviceCategories);
  }

  async getServiceCategory(id: number): Promise<ServiceCategory | undefined> {
    const [category] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    return category || undefined;
  }

  async createServiceCategory(category: InsertServiceCategory): Promise<ServiceCategory> {
    const [newCategory] = await db.insert(serviceCategories).values(category).returning();
    return newCategory;
  }

  async updateServiceCategory(id: number, category: Partial<InsertServiceCategory>): Promise<ServiceCategory | undefined> {
    const [updatedCategory] = await db
      .update(serviceCategories)
      .set(category)
      .where(eq(serviceCategories.id, id))
      .returning();
    
    return updatedCategory || undefined;
  }

  async deleteServiceCategory(id: number): Promise<boolean> {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
    return true;
  }

  // Service operations
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getServicesByCategory(categoryId: number): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.categoryId, categoryId));
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    
    return updatedService || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    await db.delete(services).where(eq(services.id, id));
    return true;
  }

  // Stylist Service Duration operations
  async getAllStylistServiceDurations(): Promise<StylistServiceDuration[]> {
    return await db.select().from(stylistServiceDurations);
  }

  async getStylistServiceDuration(id: number): Promise<StylistServiceDuration | undefined> {
    const [duration] = await db.select().from(stylistServiceDurations).where(eq(stylistServiceDurations.id, id));
    return duration || undefined;
  }

  async getStylistServiceDurationsByStylist(stylistId: number): Promise<StylistServiceDuration[]> {
    return await db.select().from(stylistServiceDurations).where(eq(stylistServiceDurations.stylistId, stylistId));
  }

  async getStylistServiceDurationByServiceAndStylist(serviceId: number, stylistId: number): Promise<StylistServiceDuration | undefined> {
    const [duration] = await db
      .select()
      .from(stylistServiceDurations)
      .where(
        and(
          eq(stylistServiceDurations.serviceId, serviceId),
          eq(stylistServiceDurations.stylistId, stylistId)
        )
      );
    
    return duration || undefined;
  }

  async createStylistServiceDuration(duration: InsertStylistServiceDuration): Promise<StylistServiceDuration> {
    const [newDuration] = await db.insert(stylistServiceDurations).values(duration).returning();
    return newDuration;
  }

  async updateStylistServiceDuration(id: number, duration: Partial<InsertStylistServiceDuration>): Promise<StylistServiceDuration | undefined> {
    const [updatedDuration] = await db
      .update(stylistServiceDurations)
      .set(duration)
      .where(eq(stylistServiceDurations.id, id))
      .returning();
    
    return updatedDuration || undefined;
  }

  async deleteStylistServiceDuration(id: number): Promise<boolean> {
    await db.delete(stylistServiceDurations).where(eq(stylistServiceDurations.id, id));
    return true;
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  // Appointment operations
  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.date, date));
  }

  async getAppointmentsByStylist(stylistId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.stylistId, stylistId));
  }

  async getAppointmentsByCustomer(customerId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.customerId, customerId));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    
    return updatedAppointment || undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    await db.delete(appointments).where(eq(appointments.id, id));
    return true;
  }

  // Stylist Schedule operations
  async getAllStylistSchedules(): Promise<StylistSchedule[]> {
    return await db.select().from(stylistSchedules);
  }

  async getStylistSchedule(id: number): Promise<StylistSchedule | undefined> {
    const [schedule] = await db.select().from(stylistSchedules).where(eq(stylistSchedules.id, id));
    return schedule || undefined;
  }

  async getStylistSchedulesByStylist(stylistId: number): Promise<StylistSchedule[]> {
    return await db.select().from(stylistSchedules).where(eq(stylistSchedules.stylistId, stylistId));
  }

  async getStylistSchedulesByStylistAndDay(stylistId: number, dayOfWeek: number): Promise<StylistSchedule[]> {
    return await db
      .select()
      .from(stylistSchedules)
      .where(
        and(
          eq(stylistSchedules.stylistId, stylistId),
          eq(stylistSchedules.dayOfWeek, dayOfWeek)
        )
      );
  }
  
  async getStylistScheduleByDay(stylistId: number, dayOfWeek: number): Promise<StylistSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(stylistSchedules)
      .where(
        and(
          eq(stylistSchedules.stylistId, stylistId),
          eq(stylistSchedules.dayOfWeek, dayOfWeek)
        )
      );
    
    return schedule || undefined;
  }

  async createStylistSchedule(schedule: InsertStylistSchedule): Promise<StylistSchedule> {
    const [newSchedule] = await db.insert(stylistSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateStylistSchedule(id: number, schedule: Partial<InsertStylistSchedule>): Promise<StylistSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(stylistSchedules)
      .set(schedule)
      .where(eq(stylistSchedules.id, id))
      .returning();
    
    return updatedSchedule || undefined;
  }

  async deleteStylistSchedule(id: number): Promise<boolean> {
    await db.delete(stylistSchedules).where(eq(stylistSchedules.id, id));
    return true;
  }

  // Helper method for permissions by name
  async getPermissionsByName(): Promise<Record<string, Permission>> {
    const allPermissions = await this.getAllPermissions();
    const permissionMap: Record<string, Permission> = {};
    
    allPermissions.forEach(permission => {
      permissionMap[permission.name] = permission;
    });
    
    return permissionMap;
  }

  // Seed the database with initial data
  async seedDatabase() {
    // Check if we already have data
    const existingRoles = await this.getAllRoles();
    if (existingRoles.length > 0) {
      console.log("Database already has data, skipping seed");
      return;
    }

    console.log("Seeding database with initial data...");
    
    // Seed roles
    const roles: InsertRole[] = [
      { name: "admin", description: "Full system access" },
      { name: "manager", description: "Manage stylists, services, and view all appointments" },
      { name: "stylist", description: "View own schedule and manage own appointments" },
      { name: "receptionist", description: "Book appointments and manage customers" },
      { name: "customer", description: "Book own appointments" }
    ];
    
    for (const role of roles) {
      await this.createRole(role);
    }
    
    // Seed permissions
    const permissions: InsertPermission[] = [
      { name: "manage_users", description: "Create, update, and delete users" },
      { name: "manage_roles", description: "Create, update, and delete roles" },
      { name: "manage_stylists", description: "Create, update, and delete stylists" },
      { name: "manage_services", description: "Create, update, and delete services" },
      { name: "manage_customers", description: "Create, update, and delete customers" },
      { name: "view_all_appointments", description: "View all appointments in the system" },
      { name: "manage_all_appointments", description: "Create, update, and delete any appointment" },
      { name: "view_own_appointments", description: "View own appointments" },
      { name: "manage_own_appointments", description: "Create, update, and delete own appointments" },
      { name: "book_appointments", description: "Book appointments for customers" }
    ];
    
    for (const permission of permissions) {
      await this.createPermission(permission);
    }
    
    // Map permissions by name for easy lookup
    const permissionMap = await this.getPermissionsByName();
    
    // Assign permissions to roles
    // Admin gets all permissions
    const adminRole = await this.getRoleByName("admin");
    if (adminRole) {
      for (const permission of Object.values(permissionMap)) {
        await this.assignPermissionToRole({
          roleId: adminRole.id,
          permissionId: permission.id
        });
      }
    }
    
    // Manager role permissions
    const managerRole = await this.getRoleByName("manager");
    if (managerRole) {
      for (const permName of ["manage_stylists", "manage_services", "view_all_appointments", 
                           "manage_all_appointments", "manage_customers", "book_appointments"]) {
        if (permissionMap[permName]) {
          await this.assignPermissionToRole({
            roleId: managerRole.id,
            permissionId: permissionMap[permName].id
          });
        }
      }
    }
    
    // Stylist role permissions
    const stylistRole = await this.getRoleByName("stylist");
    if (stylistRole) {
      for (const permName of ["view_own_appointments", "manage_own_appointments"]) {
        if (permissionMap[permName]) {
          await this.assignPermissionToRole({
            roleId: stylistRole.id,
            permissionId: permissionMap[permName].id
          });
        }
      }
    }
    
    // Receptionist role permissions
    const receptionistRole = await this.getRoleByName("receptionist");
    if (receptionistRole) {
      for (const permName of ["view_all_appointments", "book_appointments", "manage_customers"]) {
        if (permissionMap[permName]) {
          await this.assignPermissionToRole({
            roleId: receptionistRole.id,
            permissionId: permissionMap[permName].id
          });
        }
      }
    }
    
    // Customer role permissions
    const customerRole = await this.getRoleByName("customer");
    if (customerRole) {
      for (const permName of ["view_own_appointments", "book_appointments"]) {
        if (permissionMap[permName]) {
          await this.assignPermissionToRole({
            roleId: customerRole.id,
            permissionId: permissionMap[permName].id
          });
        }
      }
    }
    
    // Seed stylists
    const stylists: InsertStylist[] = [
      { name: "Martin", imageUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "Darren", imageUrl: "https://randomuser.me/api/portraits/men/76.jpg" },
      { name: "Annaliese", imageUrl: "https://randomuser.me/api/portraits/women/65.jpg" },
      { name: "Daisy", imageUrl: "https://randomuser.me/api/portraits/women/22.jpg" },
      { name: "Ryan", imageUrl: "https://randomuser.me/api/portraits/men/45.jpg" },
      { name: "Jasmine", imageUrl: "https://randomuser.me/api/portraits/women/33.jpg" }
    ];
    
    for (const stylist of stylists) {
      await this.createStylist(stylist);
    }
    
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
    for (const categoryName of categories) {
      const category = await this.createServiceCategory({ name: categoryName });
      categoryIds[categoryName] = category.id;
    }
    
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
    
    // Create services
    for (const [categoryName, services] of Object.entries(serviceData)) {
      if (categoryIds[categoryName]) {
        for (const service of services) {
          await this.createService({
            name: service.name,
            categoryId: categoryIds[categoryName],
            defaultDuration: service.defaultDuration
          });
        }
      }
    }
    
    // Set up some stylist-specific service durations
    try {
      // Make Martin faster at cuts
      await this.getStylistServiceDurationsByStylist(1);
      const cutService = await this.getService(1); // Cut & Blow Dry
      if (cutService) {
        await this.createStylistServiceDuration({
          stylistId: 1,
          serviceId: cutService.id,
          duration: 45 // 15 minutes faster than default
        });
      }
      
      // Make Annaliese specialized in highlights
      const highlightsService = await this.getService(10); // Full Highlights
      if (highlightsService) {
        await this.createStylistServiceDuration({
          stylistId: 3,
          serviceId: highlightsService.id,
          duration: 100 // 20 minutes faster than default
        });
      }
    } catch (error) {
      console.error("Error setting up stylist service durations:", error);
    }
    
    // Seed customers
    const customers: InsertCustomer[] = [
      { name: "Sasha Walker", phone: "555-123-4567", email: "sasha@example.com", notes: "" },
      { name: "Allison Holliday", phone: "555-234-5678", email: "allison@example.com", notes: "Prefers afternoon appointments" },
      { name: "Khad Akomi", phone: "555-345-6789", email: "khad@example.com", notes: "" },
      { name: "Maria Broadbent", phone: "555-456-7890", email: "maria@example.com", notes: "Allergic to certain hair products" },
      { name: "Sue Hewitt", phone: "555-567-8901", email: "sue@example.com", notes: "" },
      { name: "Natasha Denvers", phone: "555-678-9012", email: "natasha@example.com", notes: "New client" }
    ];
    
    for (const customer of customers) {
      await this.createCustomer(customer);
    }
    
    // Seed users with different roles
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser: InsertUser = {
      username: "shabnam",
      email: "shabnam@theedgesalon.com",
      password: adminPassword,
      firstName: "Shabnam",
      lastName: "Essa",
      roleId: 1, // Admin role
    };
    await this.createUser(adminUser);
    
    // Add another user with stylist role
    const stylistPassword = await bcrypt.hash("stylist123", 10);
    const stylistUser: InsertUser = {
      username: "martin",
      email: "martin@theedgesalon.com",
      password: stylistPassword,
      firstName: "Martin",
      lastName: "Stylist",
      roleId: 3, // Stylist role
      stylistId: 1 // Link to first stylist
    };
    await this.createUser(stylistUser);
    
    console.log("Database seeding completed!");
  }
}