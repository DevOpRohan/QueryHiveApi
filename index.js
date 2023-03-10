const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();

app.use(cors()); // enable CORS for all routes

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  // Preprocess the uploaded file here
  const sessionId = uuidv4();
  res.json({ sessionId: sessionId });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
