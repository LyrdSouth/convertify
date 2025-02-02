document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const convertButton = document.getElementById('convertButton');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const conversionProgress = document.querySelector('.conversion-progress');

    let selectedFile = null;

    // Add socket.io connection
    const socket = io();

    // Listen for progress updates
    socket.on('conversionProgress', (data) => {
        progressBar.style.width = `${data.percent}%`;
        progressText.textContent = `Converting... ${data.percent}%`;
    });

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
        progressBar.style.width = '0%';
        progressText.textContent = 'Converting... 0%';

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('format', format);
            formData.append('quality', quality);

            const response = await fetch('/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `converted-file.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

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
}); 