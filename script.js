let mediaRecorder;
let recordedChunks = [];

document.getElementById('startRecord').addEventListener('click', startRecording);
document.getElementById('stopRecord').addEventListener('click', stopRecording);

function startRecording() {
    const constraints = { audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess);
}

function handleSuccess(stream) {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    mediaRecorder.onstop = processAudio;
    mediaRecorder.start();
}

function stopRecording() {
    mediaRecorder.stop();
}

async function processAudio() {
    if (recordedChunks.length) {
        const audioBlob = new Blob(recordedChunks, { type: 'audio/wav' });
        const audioData = await blobToBase64(audioBlob);

        // Show the loading bar
        showLoadingBar();
        updateLoadingBar(20, 'Sending audio to server...');

        try {
            const response = await fetch('http://localhost:5500/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ audio: audioData })
            });

            updateLoadingBar(60, 'Transcribing audio...');

            const data = await response.json();
            if (data.transcription) {
                addToChatLog(data.transcription, 'user');
            } else {
                console.error('Failed to get transcription');
            }

            // Hide the loading bar after processing is complete
            hideLoadingBar();

        } catch (error) {
            // Handle errors, possibly update the loading bar with an error message
            updateLoadingBar(100, 'Error transcribing audio.');
        }

        // Clear the recorded chunks for the next recording
        recordedChunks = [];
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function addToChatLog(message, sender) {
    const chatLog = document.getElementById('chatLog');
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;
    messageDiv.textContent = message;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function updateLoadingBar(percentage, message) {
    const loadingBar = document.querySelector('.loading-bar');
    const loadingStatus = document.querySelector('.loading-status');

    loadingBar.style.width = `${percentage}%`;
    loadingStatus.textContent = message;
}

function showLoadingBar() {
    const loadingContainer = document.querySelector('.loading-container');
    loadingContainer.style.display = 'block';
}

function hideLoadingBar() {
    const loadingContainer = document.querySelector('.loading-container');
    loadingContainer.style.display = 'none';
}
