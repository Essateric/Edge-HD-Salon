import type { Express, Request as ExpressRequest, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { format, add, parse } from "date-fns";
import * as bcrypt from 'bcryptjs';
import session from 'express-session';
import { 
  insertStylistSchema, 
  insertServiceCategorySchema,
  insertServiceSchema, 
  insertStylistServiceDurationSchema,
  insertCustomerSchema, 
  insertAppointmentSchema,
  insertUserSchema,
  loginUserSchema
} from "@shared/schema";

// Define custom session data
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: number;
  }
}

// Custom request type with session
interface Request extends ExpressRequest {
  session: session.Session & Partial<session.SessionData>;
}

// Authentication middleware
const authenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
};

// Authorization middleware with permission check
const hasPermission = (permissionName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized - Please log in' });
    }
    
    // Get user permissions
    const permissions = await storage.getUserPermissions(req.session.userId);
    
    // Check if user has the required permission
    const hasPermission = permissions.some(p => p.name === permissionName);
    
    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Auth routes - no authentication required
  
  // Register new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      // Validate the input data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create the user with hashed password
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Set session
      req.session.userId = newUser.id;
      req.session.userRole = newUser.roleId;
      
      res.status(201).json({
        user: userWithoutPassword,
        message: 'User registered successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid user data', 
          errors: error.errors 
        });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      // Validate the input data
      const loginData = loginUserSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Check if password is correct
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      
      // Note: The lastLogin property is set in the MemStorage constructor,
      // so we don't need to update it here. In a real database-backed app,
      // we would need to update this field.
      
      // Set session
      req.session.userId = user.id;
      req.session.userRole = user.roleId;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        message: 'Logged in successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid login data', 
          errors: error.errors 
        });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: 'Failed to login' });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err: Error | null) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // Get current authenticated user
  app.get('/api/auth/me', authenticated, async (req: Request, res: Response) => {
    try {
      // userId is guaranteed to exist because of the authenticated middleware
      const userId = req.session.userId as number;
      
      // Get user by id
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user permissions
      const permissions = await storage.getUserPermissions(user.id);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        permissions: permissions.map(p => p.name)
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });
  
  // API routes
  const apiRouter = app.route('/api');
  
  // Stylists routes
  app.get('/api/stylists', async (_req: Request, res: Response) => {
    const stylists = await storage.getAllStylists();
    res.json(stylists);
  });
  
  app.get('/api/stylists/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const stylist = await storage.getStylist(id);
    
    if (!stylist) {
      return res.status(404).json({ message: 'Stylist not found' });
    }
    
    res.json(stylist);
  });
  
  app.post('/api/stylists', authenticated, hasPermission('manage_stylists'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertStylistSchema.parse(req.body);
      const stylist = await storage.createStylist(validatedData);
      res.status(201).json(stylist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid stylist data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create stylist' });
    }
  });
  
  // Service Categories routes
  app.get('/api/service-categories', async (_req: Request, res: Response) => {
    const categories = await storage.getAllServiceCategories();
    res.json(categories);
  });
  
  app.get('/api/service-categories/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const category = await storage.getServiceCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: 'Service category not found' });
    }
    
    res.json(category);
  });
  
  app.post('/api/service-categories', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertServiceCategorySchema.parse(req.body);
      const category = await storage.createServiceCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create service category' });
    }
  });
  
  app.put('/api/service-categories/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      
      const updatedCategory = await storage.updateServiceCategory(id, categoryData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: 'Service category not found' });
      }
      
      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update service category' });
    }
  });
  
  app.delete('/api/service-categories/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteServiceCategory(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Service category not found' });
    }
    
    res.status(204).end();
  });
  
  // Services routes
  app.get('/api/services', async (_req: Request, res: Response) => {
    const services = await storage.getAllServices();
    res.json(services);
  });
  
  app.get('/api/services/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const service = await storage.getService(id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  });
  
  app.get('/api/services/category/:categoryId', async (req: Request, res: Response) => {
    const categoryId = parseInt(req.params.categoryId);
    const services = await storage.getServicesByCategory(categoryId);
    res.json(services);
  });
  
  app.post('/api/services', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid service data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create service' });
    }
  });
  
  app.put('/api/services/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = req.body;
      
      const updatedService = await storage.updateService(id, serviceData);
      
      if (!updatedService) {
        return res.status(404).json({ message: 'Service not found' });
      }
      
      res.json(updatedService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid service data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update service' });
    }
  });
  
  app.delete('/api/services/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteService(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(204).end();
  });
  
  // Stylist Service Durations routes
  app.get('/api/stylist-service-durations', async (req: Request, res: Response) => {
    const stylistId = req.query.stylistId ? parseInt(req.query.stylistId as string) : undefined;
    
    let durations;
    if (stylistId) {
      durations = await storage.getStylistServiceDurationsByStylist(stylistId);
    } else {
      durations = await storage.getAllStylistServiceDurations();
    }
    
    res.json(durations);
  });
  
  app.get('/api/stylist-service-durations/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const duration = await storage.getStylistServiceDuration(id);
    
    if (!duration) {
      return res.status(404).json({ message: 'Stylist service duration not found' });
    }
    
    res.json(duration);
  });
  
  app.get('/api/stylist-service-durations/stylist/:stylistId/service/:serviceId', async (req: Request, res: Response) => {
    const stylistId = parseInt(req.params.stylistId);
    const serviceId = parseInt(req.params.serviceId);
    
    const duration = await storage.getStylistServiceDurationByServiceAndStylist(serviceId, stylistId);
    
    if (!duration) {
      return res.status(404).json({ message: 'Stylist service duration not found' });
    }
    
    res.json(duration);
  });
  
  app.post('/api/stylist-service-durations', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertStylistServiceDurationSchema.parse(req.body);
      const duration = await storage.createStylistServiceDuration(validatedData);
      res.status(201).json(duration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid duration data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create stylist service duration' });
    }
  });
  
  app.put('/api/stylist-service-durations/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const durationData = req.body;
      
      const updatedDuration = await storage.updateStylistServiceDuration(id, durationData);
      
      if (!updatedDuration) {
        return res.status(404).json({ message: 'Stylist service duration not found' });
      }
      
      res.json(updatedDuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid duration data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update stylist service duration' });
    }
  });
  
  app.delete('/api/stylist-service-durations/:id', authenticated, hasPermission('manage_services'), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteStylistServiceDuration(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Stylist service duration not found' });
    }
    
    res.status(204).end();
  });
  
  // Customers routes
  app.get('/api/customers', authenticated, hasPermission('view_customers'), async (_req: Request, res: Response) => {
    const customers = await storage.getAllCustomers();
    res.json(customers);
  });
  
  app.get('/api/customers/:id', authenticated, hasPermission('view_customers'), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const customer = await storage.getCustomer(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  });
  
  app.post('/api/customers', authenticated, hasPermission('manage_customers'), async (req: Request, res: Response) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid customer data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create customer' });
    }
  });
  
  // Appointments routes
  app.get('/api/appointments', authenticated, hasPermission('view_all_appointments'), async (req: Request, res: Response) => {
    const date = req.query.date as string;
    const stylistId = req.query.stylistId ? parseInt(req.query.stylistId as string) : undefined;
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    
    let appointments;
    
    if (date) {
      appointments = await storage.getAppointmentsByDate(date);
    } else if (stylistId) {
      appointments = await storage.getAppointmentsByStylist(stylistId);
    } else if (customerId) {
      appointments = await storage.getAppointmentsByCustomer(customerId);
    } else {
      appointments = await storage.getAllAppointments();
    }
    
    res.json(appointments);
  });
  
  app.get('/api/appointments/:id', authenticated, hasPermission('view_all_appointments'), async (req: Request, res: Response) => {
    const appointments = await storage.getAllAppointments();
    const appointment = appointments.find(a => a.id === parseInt(req.params.id));
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  });
  
  app.post('/api/appointments', authenticated, hasPermission('book_appointments'), async (req: Request, res: Response) => {
    try {
      // Extract basic appointment data
      const { 
        customerId, 
        customerName, 
        stylistId, 
        serviceId, 
        serviceName, 
        date, 
        startTime, 
        endTime,
        duration, 
        notes, 
        isConsultation 
      } = req.body;
      
      // Get service details if not provided
      let serviceDetails;
      if (!serviceName) {
        serviceDetails = await storage.getService(serviceId);
        if (!serviceDetails) {
          return res.status(400).json({ message: 'Service not found' });
        }
      }
      
      // Create appointment object
      const appointmentData = {
        customerId: customerId || null,
        customerName: customerName || null,
        stylistId,
        serviceId,
        serviceName: serviceName || serviceDetails?.name,
        date,
        startTime,
        endTime: endTime || '', // Now provided by client
        notes: notes || null,
        isConsultation: isConsultation || null
      };
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid appointment data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create appointment' });
    }
  });
  
  app.put('/api/appointments/:id', authenticated, hasPermission('manage_all_appointments'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = req.body;
      
      const updatedAppointment = await storage.updateAppointment(id, appointmentData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid appointment data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update appointment' });
    }
  });
  
  app.delete('/api/appointments/:id', authenticated, hasPermission('manage_all_appointments'), async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteAppointment(id);
    
    if (!success) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
