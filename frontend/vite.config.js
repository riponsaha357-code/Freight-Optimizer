import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve directory name for ES Modules compatibility
const __filename = fileURLToPath(
    import.meta.url)
const __dirname = path.dirname(__filename)

const certPath = path.resolve(__dirname, '../backend/certs/cert.pem')
const keyPath = path.resolve(__dirname, '../backend/certs/key.pem')

const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

export default defineConfig({
    plugins: [react()],
    server: {
        https: hasCerts ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        } : false,
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'https://127.0.0.1:8000',
                changeOrigin: true,
                secure: false, // Accepts self-signed certificates on local backend
                ws: true,
            },
        },
    },
})