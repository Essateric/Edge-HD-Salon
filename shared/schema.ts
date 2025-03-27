import { pgTable, text, serial, integer, boolean, time, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Stylists table
export const stylists = pgTable("stylists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const insertStylistSchema = createInsertSchema(stylists).pick({
  name: true,
  imageUrl: true,
});

// Service Categories table
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertServiceCategorySchema = createInsertSchema(serviceCategories).pick({
  name: true,
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
  defaultDuration: integer("default_duration").notNull(), // in minutes
  price: integer("price").notNull().default(0), // in pennies
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  categoryId: true,
  defaultDuration: true,
  price: true,
});

// Stylist service durations
export const stylistServiceDurations = pgTable("stylist_service_durations", {
  id: serial("id").primaryKey(),
  stylistId: integer("stylist_id").notNull(),
  serviceId: integer("service_id").notNull(),
  duration: integer("duration").notNull(), // in minutes (can differ from default)
});

export const insertStylistServiceDurationSchema = createInsertSchema(stylistServiceDurations).pick({
  stylistId: true,
  serviceId: true,
  duration: true,
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  phone: true,
  email: true,
  notes: true,
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  customerName: text("customer_name"), // For customers without an account
  stylistId: integer("stylist_id").notNull(),
  serviceId: integer("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: integer("duration").notNull().default(30), // Duration in minutes
  notes: text("notes"),
  isConsultation: boolean("is_consultation").default(false),
  status: text("status").default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  customerId: true,
  customerName: true,
  stylistId: true,
  serviceId: true,
  serviceName: true,
  date: true,
  startTime: true,
  endTime: true,
  duration: true,
  notes: true,
  isConsultation: true,
  status: true,
});

export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type Stylist = typeof stylists.$inferSelect;

export type InsertServiceCategory = z.infer<typeof insertServiceCategorySchema>;
export type ServiceCategory = typeof serviceCategories.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertStylistServiceDuration = z.infer<typeof insertStylistServiceDurationSchema>;
export type StylistServiceDuration = typeof stylistServiceDurations.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

// Roles table for permission management
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., admin, manager, stylist, receptionist, customer
  description: text("description"),
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
});

// Permissions table for granular access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., manage_stylists, view_appointments, etc.
  description: text("description"),
});

export const insertPermissionSchema = createInsertSchema(permissions).pick({
  name: true,
  description: true,
});

// Role-Permission mapping for role-based access control
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  permissionId: integer("permission_id").notNull(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).pick({
  roleId: true,
  permissionId: true,
});

// Enhanced Users table with roles and authentication details
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  roleId: integer("role_id").notNull().default(4), // Default to customer role
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  customerId: integer("customer_id"), // Link to customer record if applicable
  stylistId: integer("stylist_id"), // Link to stylist record if applicable
  profileImageUrl: text("profile_image_url"), // URL for user profile image
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  roleId: true,
  customerId: true,
  stylistId: true,
  profileImageUrl: true,
});

// Schema for login
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;
// Stylist Schedules table for working hours and availability
export const stylistSchedules = pgTable("stylist_schedules", {
  id: serial("id").primaryKey(),
  stylistId: integer("stylist_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // Format: "HH:MM"
  endTime: text("end_time").notNull(), // Format: "HH:MM"
  isWorkingDay: boolean("is_working_day").default(true),
});

export const insertStylistScheduleSchema = createInsertSchema(stylistSchedules).pick({
  stylistId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  isWorkingDay: true,
});

export type InsertStylistSchedule = z.infer<typeof insertStylistScheduleSchema>;
export type StylistSchedule = typeof stylistSchedules.$inferSelect;

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
