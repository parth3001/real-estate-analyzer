// API URL configuration
export const API_URL = 
  // Try Vite style env vars
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
  // Try CRA style env vars
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 
  // Fallback
  'http://localhost:3001';

// Other configuration settings can be added here as needed
export const APP_VERSION = '1.0.0';
export const MAX_SAVED_DEALS = 50; // Maximum number of deals to store in localStorage 