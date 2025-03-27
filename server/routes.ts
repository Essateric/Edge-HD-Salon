import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { format } from "date-fns";
import { 
  insertStylistSchema, 
  insertServiceSchema, 
  insertCustomerSchema, 
  insertAppointmentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  app.post('/api/stylists', async (req: Request, res: Response) => {
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
  
  app.get('/api/services/category/:category', async (req: Request, res: Response) => {
    const category = req.params.category;
    const services = await storage.getServicesByCategory(category);
    res.json(services);
  });
  
  app.post('/api/services', async (req: Request, res: Response) => {
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
  
  // Customers routes
  app.get('/api/customers', async (_req: Request, res: Response) => {
    const customers = await storage.getAllCustomers();
    res.json(customers);
  });
  
  app.get('/api/customers/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const customer = await storage.getCustomer(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  });
  
  app.post('/api/customers', async (req: Request, res: Response) => {
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
  app.get('/api/appointments', async (req: Request, res: Response) => {
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
  
  app.get('/api/appointments/:id', async (req: Request, res: Response) => {
    const appointments = await storage.getAllAppointments();
    const appointment = appointments.find(a => a.id === parseInt(req.params.id));
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    res.json(appointment);
  });
  
  app.post('/api/appointments', async (req: Request, res: Response) => {
    try {
      // Extract basic appointment data
      const { 
        customerId, 
        customerName, 
        stylistId, 
        serviceId, 
        date, 
        startTime, 
        duration, 
        notes, 
        isConsultation 
      } = req.body;
      
      // Get service details
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(400).json({ message: 'Service not found' });
      }
      
      // Calculate end time based on duration
      const appointmentDuration = duration || service.duration;
      
      // Create appointment object
      const appointmentData = {
        customerId: customerId || null,
        customerName: customerName || null,
        stylistId,
        serviceId,
        serviceName: service.name,
        date,
        startTime,
        endTime: '', // Will be calculated in storage.createAppointment
        notes: notes || '',
        isConsultation: isConsultation || false
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
  
  app.put('/api/appointments/:id', async (req: Request, res: Response) => {
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
  
  app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
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
