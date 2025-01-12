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
                .size('720x?')
                .fps(15)
                .outputOptions([
                    '-vf scale=720:-1:flags=lanczos',
                    '-loop 0'
                ]);
            break;
        case 'mp4':
            command
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOptions([
                    '-preset slow',
                    '-crf 22',
                    '-movflags +faststart'
                ]);
            break;
        case 'webm':
            command
                .videoCodec('libvpx-vp9')
                .audioCodec('libopus')
                .outputOptions([
                    '-crf 30',
                    '-b:v 0',
                    '-deadline good'
                ]);
            break;
        case 'mp3':
            command
                .toFormat('mp3')
                .audioCodec('libmp3lame')
                .audioBitrate('320k');
            break;
    }

    // Add quality settings
    if (req.body.quality) {
        switch(req.body.quality) {
            case 'low':
                command.outputOptions([
                    '-b:v 1000k',
                    '-b:a 128k'
                ]);
                break;
            case 'medium':
                command.outputOptions([
                    '-b:v 2500k',
                    '-b:a 192k'
                ]);
                break;
            case 'high':
                command.outputOptions([
                    '-b:v 5000k',
                    '-b:a 320k',
                    '-preset slower'
                ]);
                break;
        }
    }

    // Add general quality improvements
    command.outputOptions([
        '-threads 0',
        '-map_metadata -1'
    ]);

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