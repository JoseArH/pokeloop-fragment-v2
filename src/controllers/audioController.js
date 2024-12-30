const audioService = require('../services/audioService');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/audio/');
    },
    filename: (req, file, cb) => {
        // Asegurar nombre de archivo único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Validar tipo de archivo
        if (file.mimetype !== 'audio/mpeg') {
            return cb(new Error('Only MP3 files are allowed'), false);
        }
        cb(null, true);
    }
});

exports.uploadAudio = [
    upload.single('audioFile'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const audioInfo = await audioService.processUploadedAudio(req.file, req.body);
            res.status(201).json(audioInfo);
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: error.message });
        }
    }
];

exports.getAudioInfo = async (req, res) => {
    try {
        const audioInfo = await audioService.getAudioInfo(req.params.id);
        if (audioInfo) {
            res.json(audioInfo);
        } else {
            res.status(404).json({ error: 'Audio not found' });
        }
    } catch (error) {
        console.error('Get audio info error:', error);
        res.status(500).json({ error: 'Error retrieving audio information' });
    }
};

exports.getAllAudioInfo = async (req, res) => {
    try {
        const allAudioInfo = await audioService.getAllAudioInfo();
        res.json(allAudioInfo);
    } catch (error) {
        console.error('Get all audio info error:', error);
        res.status(500).json({ error: 'Error retrieving audio list' });
    }
};

exports.streamAudio = async (req, res) => {
    try {
        await audioService.streamAudio(req, res);
    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error streaming audio' });
        }
    }
};

exports.updateLoopPoints = async (req, res) => {
    try {
        const { id, startLoop, endLoop } = req.body;
        const result = await audioService.updateLoopPoints(id, startLoop, endLoop);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Update loop points error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating loop points',
            error: error.message
        });
    }
};

exports.deleteAudio = async (req, res) => {
    try {
        const audioInfo = await audioService.deleteAudio(req.params.id);
        if (audioInfo) {
            res.json({ success: true, message: 'Audio deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Audio not found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Error deleting audio' });
    }
};