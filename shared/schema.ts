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
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  categoryId: true,
  defaultDuration: true,
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
  notes: text("notes"),
  isConsultation: boolean("is_consultation").default(false),
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
  notes: true,
  isConsultation: true,
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

// Users table (keeping from original schema for system users)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
