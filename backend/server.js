const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const speech = require('@google-cloud/speech');

const app = express();
const port = 5500;

// Instantiates a client
const client = new speech.SpeechClient({ keyFilename: './voicegpt-395704-d7eb4ae10363.json' });

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use(cors());
app.use(bodyParser.json());

app.post('/transcribe', async (req, res) => {
    const audio = req.body.audio;
    const audioBytes = audio.split(';base64,')[1];

    const request = {
        audio: {
            content: audioBytes,
        },
        config: {
            encoding: 'LINEAR16',
            languageCode: 'en-US',
        },
    };

    try {
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        res.send({ transcription });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        res.status(500).send({ error: 'Failed to transcribe audio' });
    }
});

app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
