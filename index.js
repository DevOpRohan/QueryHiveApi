const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

app.use(cors()); // enable CORS for all routes

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Map of session IDs to file data
const fileDataBySessionId = {};

app.post('/upload', upload.single('file'), (req, res) => {
  console.log('File uploaded successfully!');
  // Preprocess the uploaded file here
  const sessionId = uuidv4();

  // Save the file data in memory and map it to the session ID
  fileDataBySessionId[sessionId] = req.file.buffer;

  // Return the session ID to the client
  console.log(`Sending Session ${sessionId}`);
  res.json({ sessionId: sessionId });
});

app.delete('/clearSession', (req, res) => {
  const sessionId = req.query.id;

  if (!sessionId) {
    return res.status(400).json({ message: 'Session ID is required' });
  }

  try {
    // Delete the file data from memory
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
