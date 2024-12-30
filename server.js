require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize } = require('./src/models');
const audioRoutes = require('./src/routes/audioRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

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

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.message
    });
});

// Sync database and start server
sequelize.sync({ alter: true })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Unable to connect to the database:', error);
    });
