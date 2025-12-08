import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';

// Connection pool for general queries
export const pool = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for compatibility
});

// Connection for migrations (single connection)
export const migrationClient = postgres(connectionString, {
  max: 1,
  prepare: false,
});