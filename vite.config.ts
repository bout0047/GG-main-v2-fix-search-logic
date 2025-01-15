import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3005,
        host: true, // This enables listening on all network interfaces
        strictPort: true, // This ensures Vite only uses the specified port
    },
});