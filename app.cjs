// Passenger loads a CommonJS startup file, then starts the ESM server.
// Build with npm run build before starting this application.
import('./server/dist/index.js').catch((error) => {
  console.error('Webmail startup failed:', error);
  process.exit(1);
});
