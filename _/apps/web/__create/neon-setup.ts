/**
 * Neon database WebSocket setup - MUST be imported before any @neondatabase/serverless usage
 * 
 * This sets up the WebSocket constructor for the Neon serverless driver.
 * Must be imported at the very beginning of the server entry point.
 */
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Set WebSocket constructor for Neon serverless driver
// This MUST happen before any Pool or neon() calls
neonConfig.webSocketConstructor = ws;

console.log('[neon-setup] WebSocket constructor configured for Neon');

