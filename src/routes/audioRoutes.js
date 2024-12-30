const express = require('express');
const audioController = require('../controllers/audioController');

const router = express.Router();

// Middleware para validar ID
const validateId = (req, res, next) => {
    const id = req.params.id;
    if (!id || id.length !== 8) {
        return res.status(400).json({ error: 'Invalid audio ID format' });
    }
    next();
};

// Middleware para validar loop points
const validateLoopPoints = (req, res, next) => {
    const { startLoop, endLoop } = req.body;
    if (startLoop === undefined || endLoop === undefined) {
        return res.status(400).json({ error: 'Missing loop points' });
    }
    if (isNaN(startLoop) || isNaN(endLoop)) {
        return res.status(400).json({ error: 'Loop points must be numbers' });
    }
    if (startLoop < 0 || endLoop < 0) {
        return res.status(400).json({ error: 'Loop points cannot be negative' });
    }
    if (startLoop >= endLoop) {
        return res.status(400).json({ error: 'Start loop must be less than end loop' });
    }
    next();
};

// Rutas para gestión de archivos de audio
router.post('/upload', audioController.uploadAudio);
router.get('/all', audioController.getAllAudioInfo);
router.get('/:id/info', validateId, audioController.getAudioInfo);
router.get('/:id/stream', validateId, audioController.streamAudio);
router.post('/loop', validateLoopPoints, audioController.updateLoopPoints);
router.delete('/:id', validateId, audioController.deleteAudio); // Movida antes del middleware *

// Este middleware debe ser el último
router.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

module.exports = router;
