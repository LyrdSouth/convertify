document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const convertButton = document.getElementById('convertButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const conversionProgress = document.querySelector('.conversion-progress');

    let selectedFile = null;

    // Handle file selection
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files[0]);
    });

    function handleFileSelect(file) {
        if (!file) return;

        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid video file');
            return;
        }

        selectedFile = file;
        convertButton.disabled = false;
        dropZone.querySelector('p').textContent = `Selected: ${file.name}`;
    }

    // Handle conversion
    convertButton.addEventListener('click', async () => {
        if (!selectedFile) return;

        const format = document.getElementById('formatSelect').value;
        const quality = document.getElementById('qualitySelect').value;

        // Show progress UI
        conversionProgress.hidden = false;
        convertButton.disabled = true;

        try {
            // In a real implementation, you would:
            // 1. Create a FormData object with the file and conversion options
            // 2. Send it to your backend server
            // 3. Use FFmpeg on the server to convert the file
            // 4. Send progress updates to the frontend
            // 5. Return the converted file

            // This is a simulation of the conversion process
            await simulateConversion();

            alert('Conversion completed! The file would now be downloaded.');
        } catch (error) {
            alert('An error occurred during conversion');
            console.error(error);
        } finally {
            conversionProgress.hidden = true;
            convertButton.disabled = false;
            resetUI();
        }
    });

    function resetUI() {
        selectedFile = null;
        fileInput.value = '';
        dropZone.querySelector('p').textContent = 'Drag and drop your file here or';
        convertButton.disabled = true;
        progressBar.style.width = '0%';
        progressText.textContent = 'Converting... 0%';
    }

    // Simulate conversion progress
    function simulateConversion() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 1;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `Converting... ${progress}%`;

                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, 50);
        });
    }
}); 