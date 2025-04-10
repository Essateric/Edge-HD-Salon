import { Handler } from '@netlify/functions';
import bcrypt from 'bcryptjs';

// Mock user database for demo purposes
// In production, you would connect to your actual database
const users = [
  {
    id: 1,
    username: 'shabnam',
    email: 'essa@theedgesalon.com',
    password: '$2a$10$XgzY7CcJH46QxfDOElSVu.eKbBWQol0PY8o/./hBKcjNfyS/.ZmjW', // password123
    userRole: 1
  },
  {
    id: 2,
    username: 'martin',
    email: 'martin@theedgesalon.com',
    password: '$2a$10$XgzY7CcJH46QxfDOElSVu.eKbBWQol0PY8o/./hBKcjNfyS/.ZmjW', // password123
    userRole: 2
  }
];

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
    const user = users.find(u => u.email === email);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid email or password' })
      };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ status: 'error', message: 'Invalid email or password' })
      };
    }

    // Strip password from user object before returning
    const { password: _, ...userWithoutPassword } = user;

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        user: userWithoutPassword,
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