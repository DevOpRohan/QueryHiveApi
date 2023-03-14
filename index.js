require ('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
app.use(cors()); // enable CORS for all routes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fileDataBySessionId = {};

app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('File uploaded successfully!');
  const sessionId = uuidv4();
  const fileContent = req.file.buffer.toString();
  let currentHeading = '';
  let currentTitle = '';
  let currentContent = '';
  const sections = [];
  const lines = fileContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      currentHeading = line.substring(1);
      console.log(`\n${currentHeading}\n`);
    } else if (line.startsWith('$')) {
      currentTitle = line.substring(1, line.indexOf(':'));
      console.log(`${currentTitle}:`);
      currentContent = '';
    } else {
      currentContent += line;
      if (i === lines.length - 1 || lines[i + 1].startsWith('#') || lines[i + 1].startsWith('$')) {
        console.log(`\t${currentContent.trim()}\n`);
        sections.push({
          heading: currentHeading,
          title: currentTitle,
          content: currentContent.trim()
        });
      }
    }
  }
  const model = 'text-embedding-ada-002';
  const input = sections.map(section => section.content);
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  try {
    const response = await openai.createEmbedding({ model, input });
    responseData = response.data;
    console.log(responseData);
    const embeddings = responseData.data.map(data => data.embedding);
    sections.forEach((section, index) => {
      section.embedding = embeddings[index];
    });
    console.log(sections);
    fileDataBySessionId[sessionId] = sections;
    console.log(`Sending Session ${sessionId}`);
    res.json({ sessionId: sessionId });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to process file' });
  }
});

app.delete('/clearSession', (req, res) => {
  const sessionId = req.query.id;
  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }
  try {
    delete fileDataBySessionId[sessionId];
    console.log(`Session ${sessionId} deleted successfully`);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error(`Failed to delete session ${sessionId}`, err);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
