import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import { storage } from '../../../server/storage';

export const handler: Handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const { email, password } = JSON.parse(event.body || '{}');

    // Validate request body
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Email and password are required' })
      };
    }

    // Find user by email
    console.log(`Attempting to login with email: ${email}`);
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log(`User not found: ${email}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid email or password' })
      };
    }
    
    console.log(`User found: ${user.username}, comparing passwords...`);
    console.log(`DB Password: ${user.password.substring(0, 10)}...`);
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid email or password' })
      };
    }

    // Get user's role
    const role = await storage.getRole(user.roleId);
    
    // Strip password from user object before returning
    const { password: _, ...userWithoutPassword } = user;
    
    // Add role info to the response
    const userWithRole = {
      ...userWithoutPassword,
      role: role || { name: 'unknown' }
    };

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        user: userWithRole,
        message: 'Login successful'
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: 'error', message: 'Internal server error' })
    };
  }
};