const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mm = require('music-metadata');
const crypto = require('crypto');
const audioUtils = require('../utils/audioUtils');
const { Audio } = require('../models');

const statAsync = promisify(fs.stat);
const AUDIO_DIRECTORY = path.join(process.cwd(), 'public', 'audio');

// Asegurarse de que la carpeta existe al iniciar el servicio
audioUtils.ensureDirectoryExists(AUDIO_DIRECTORY);

// Cargar datos existentes si hay archivos en la carpeta
async function loadExistingAudioFiles() {
    try {
        if (fs.existsSync(AUDIO_DIRECTORY)) {
            const files = fs.readdirSync(AUDIO_DIRECTORY);
            for (const filename of files) {
                if (filename.endsWith('.mp3')) {
                    const filePath = path.join(AUDIO_DIRECTORY, filename);
                    try {
                        const metadata = await mm.parseFile(filePath);
                        const fileStats = await statAsync(filePath);
                        const id = crypto.randomBytes(4).toString('hex');
                        
                        const existingAudio = await Audio.findOne({
                            where: { filePath: filePath }
                        });

                        if (!existingAudio) {
                            const sampleRate = metadata.format.sampleRate || 44100;
                            const totalSamples = Math.floor(metadata.format.duration * sampleRate);
                            await Audio.create({
                                id,
                                name: filename.replace('.mp3', ''),
                                game: 'Unknown Game',
                                filePath: filePath,
                                samplingRate: sampleRate,
                                duration: metadata.format.duration,
                                bitrate: metadata.format.bitrate,
                                fileSize: fileStats.size,
                                startLoop: 0,
                                endLoop: Math.floor(totalSamples * 0.95)
                            });
                        }
                    } catch (error) {
                        console.error(`Error loading existing audio file ${filename}:`, error);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading existing audio files:', error);
    }
}

// Cargar archivos existentes al iniciar el servicio
loadExistingAudioFiles();

exports.processUploadedAudio = async (file, body) => {
    try {
        const filePath = path.join(AUDIO_DIRECTORY, file.filename);
        const metadata = await mm.parseFile(filePath);
        const fileStats = await statAsync(filePath);
        const id = crypto.randomBytes(4).toString('hex');
        
        // Debug logs
        console.log('Received sampling rate from form:', body.samplingRate);
        console.log('File metadata sampling rate:', metadata.format.sampleRate);

        // Usar el samplerate proporcionado o el detectado del archivo
        const samplingRate = body.samplingRate ? 
            parseInt(body.samplingRate) : 
            metadata.format.sampleRate;

        console.log('Final sampling rate to be used:', samplingRate);

        // Calcular totalSamples usando el samplingRate correcto
        const totalSamples = Math.floor(metadata.format.duration * samplingRate);
        const defaultEndLoop = Math.floor(totalSamples * 0.95);

        // Debug log para los puntos de loop
        console.log('Total samples:', totalSamples);
        console.log('Default end loop:', defaultEndLoop);
        console.log('Provided start loop:', body.startLoop);
        console.log('Provided end loop:', body.endLoop);

        const audioInfo = await Audio.create({
            id,
            name: body.name || file.originalname.replace('.mp3', ''),
            game: body.game || 'Unknown Game',
            filePath: filePath,
            samplingRate: samplingRate,
            duration: metadata.format.duration,
            bitrate: metadata.format.bitrate,
            fileSize: fileStats.size,
            startLoop: body.startLoop ? parseInt(body.startLoop) : 0,
            endLoop: body.endLoop ? parseInt(body.endLoop) : defaultEndLoop
        });

        // Debug log para la información guardada
        console.log('Saved audio info:', audioInfo.toJSON());

        return audioInfo;
    } catch (error) {
        console.error('Error processing uploaded audio:', error);
        throw new Error('Failed to process audio file');
    }
};

exports.getAudioInfo = async (id) => {
    try {
        const audioInfo = await Audio.findByPk(id);
        return audioInfo;
    } catch (error) {
        console.error('Error getting audio info:', error);
        return null;
    }
};

exports.getAllAudioInfo = async () => {
    try {
        const audioList = await Audio.findAll();
        return audioList;
    } catch (error) {
        console.error('Error getting all audio info:', error);
        return [];
    }
};

exports.streamAudio = async (req, res) => {
    try {
        const audioInfo = await Audio.findByPk(req.params.id);
        
        if (!audioInfo) {
            return res.status(404).json({ error: 'Audio not found' });
        }

        const audioPath = audioInfo.filePath;
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }

        const stat = fs.statSync(audioPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
            const chunksize = (end-start)+1;
            const file = fs.createReadStream(audioPath, {start, end});
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(200, head);
            fs.createReadStream(audioPath).pipe(res);
        }
    } catch (error) {
        console.error('Error streaming audio:', error);
        res.status(500).json({ error: 'Error streaming audio file' });
    }
};

exports.updateLoopPoints = async (id, startLoop, endLoop) => {
    try {
        const audio = await Audio.findByPk(id);
        
        if (!audio) {
            return { success: false, message: 'Audio not found' };
        }

        // Calcular el total de samples y validar los puntos de loop
        const totalSamples = Math.floor(audio.duration * audio.samplingRate);
        
        // Validar y ajustar los puntos de loop si es necesario
        if (endLoop > totalSamples) {
            endLoop = Math.floor(totalSamples * 0.95);
        }
        
        if (startLoop >= endLoop) {
            return { 
                success: false, 
                message: 'Start loop point must be less than end loop point' 
            };
        }

        await audio.update({
            startLoop: startLoop,
            endLoop: endLoop
        });

        return {
            success: true,
            message: 'Loop points updated successfully',
            data: audio
        };
    } catch (error) {
        console.error('Error updating loop points:', error);
        return { success: false, message: 'Error updating loop points' };
    }
};

exports.deleteAudio = async (id) => {
    const transaction = await Audio.sequelize.transaction();
    
    try {
        // Buscar el audio primero
        const audio = await Audio.findByPk(id, { transaction });
        
        if (!audio) {
            await transaction.rollback();
            return null;
        }

        const filePath = audio.filePath;

        // Primero eliminar de la base de datos
        await audio.destroy({ transaction });

        // Verificar y eliminar el archivo físico
        if (fs.existsSync(filePath)) {
            try {
                await new Promise((resolve, reject) => {
                    fs.unlink(filePath, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } catch (fileError) {
                // Si falla la eliminación del archivo, hacer rollback de la transacción
                await transaction.rollback();
                console.error('Error deleting physical file:', fileError);
                throw new Error('Failed to delete audio file');
            }
        }

        // Si todo salió bien, confirmar la transacción
        await transaction.commit();
        return true;
    } catch (error) {
        // Si algo falla, hacer rollback
        await transaction.rollback();
        console.error('Error in deleteAudio:', error);
        throw error;
    }
};