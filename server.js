const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/convert', upload.single('file'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = path.join('outputs', `output.${req.body.format}`);
    
    ffmpeg(inputPath)
        .toFormat(req.body.format)
        .on('progress', (progress) => {
            // Send progress updates to client
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
            res.download(outputPath, () => {
                // Clean up files
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Conversion failed');
        })
        .save(outputPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 