const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads and outputs directories exist
['uploads', 'outputs'].forEach(dir => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
});

app.use(express.static('public'));

// Add WebSocket support
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.post('/convert', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const inputPath = req.file.path;
    const outputFileName = `output-${Date.now()}.${req.body.format}`;
    const outputPath = path.join('outputs', outputFileName);
    
    let command = ffmpeg(inputPath);

    // Add specific settings based on format
    switch(req.body.format) {
        case 'gif':
            command
                .size('640x?')
                .fps(10);
            break;
        case 'mp4':
            command
                .videoCodec('libx264')
                .audioCodec('aac');
            break;
        case 'mp3':
            command
                .toFormat('mp3')
                .audioCodec('libmp3lame');
            break;
    }

    // Add quality settings
    if (req.body.quality) {
        switch(req.body.quality) {
            case 'low':
                command.videoBitrate('500k');
                break;
            case 'medium':
                command.videoBitrate('1000k');
                break;
            case 'high':
                command.videoBitrate('2000k');
                break;
        }
    }

    command
        .on('progress', (progress) => {
            // Send progress to all connected clients
            io.emit('conversionProgress', {
                percent: Math.round(progress.percent)
            });
        })
        .on('end', () => {
            io.emit('conversionProgress', { percent: 100 });
            res.download(outputPath, `converted-file.${req.body.format}`, (err) => {
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {
                    console.error('Error cleaning up files:', e);
                }
            });
        })
        .on('error', (err) => {
            console.error('Error:', err);
            // Cleanup input file
            try {
                fs.unlinkSync(inputPath);
            } catch (e) {
                console.error('Error cleaning up input file:', e);
            }
            res.status(500).send('Conversion failed');
        })
        .save(outputPath);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 