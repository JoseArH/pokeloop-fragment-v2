require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize } = require('./src/models');
const audioRoutes = require('./src/routes/audioRoutes');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que existe el directorio de audio
const audioDirectory = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDirectory)) {
    fs.mkdirSync(audioDirectory, { recursive: true });
}

// Middlewares básicos
app.use(express.json());
app.use(express.static('public'));

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Middleware para manejar errores de JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('JSON Parse Error:', err);
        return res.status(400).json({ 
            error: 'Invalid JSON',
            details: err.message 
        });
    }
    next(err);
});

// Routes
app.use('/api/audio', audioRoutes);

// Página principal (reproductor)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Página de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Middleware para manejo de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.url} not found`
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Determinar el tipo de error y enviar una respuesta apropiada
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            success: false,
            message: 'Duplicate Entry',
            error: err.errors[0].message
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Función para manejar el cierre graceful del servidor
function gracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    // Cerrar el servidor HTTP
    server.close(async () => {
        console.log('HTTP server closed.');
        
        try {
            // Cerrar la conexión con la base de datos
            await sequelize.close();
            console.log('Database connection closed.');
            
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
}

// Sync database and start server
sequelize.sync({ alter: true })
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Admin interface available at http://localhost:${PORT}/admin`);
            console.log(`Player available at http://localhost:${PORT}`);
        });

        // Manejar señales de terminación
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Manejar errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    })
    .catch(error => {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    });
