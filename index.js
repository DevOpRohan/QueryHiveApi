require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createEmbeddings } = require('./openaiApi');

const app = express();
app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

function preprocessDocument(fileContent) {
  let currentTitle = '';
  let currentHeading = '';
  let currentContent = '';
  const sections = [];
  const lines = fileContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('##')) {
      currentTitle = line.substring(2);
      console.log(`\n${currentTitle}\n`);
    } else if (line.startsWith('###')) {
      currentHeading = line.substring(3, line.indexOf(':'));
      console.log(`${currentHeading}:`);
      currentContent = '';
    } else {
      currentContent += line;
      if (i === lines.length - 1 || lines[i + 1].startsWith('##') || lines[i + 1].startsWith('###')) {
        console.log(`\t${currentContent.trim()}\n`);
        sections.push({
          title: currentTitle,
          heading: currentHeading,
          content: currentContent.trim(),
        });
      }
    }
  }
  return sections;
}

async function processFile(req) {
  const fileContent = req.file.buffer.toString();
  const sections = preprocessDocument(fileContent);

  const model = 'text-embedding-ada-002';
  const input = sections.map((section) => section.content);
  const embeddings = await createEmbeddings(model, input);

  sections.forEach((section, index) => {
    section.index = index;
    section.embedding = embeddings[index];
  });

  return sections;
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('File uploaded successfully!');
    const sections = await processFile(req);
    res.json({ sections: sections });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to process file' });
  }
});

async function processQuery(query) {
  const model = 'text-embedding-ada-002';
  const input = [query];
  const embeddings = await createEmbeddings(model, input);
  return embeddings[0];
}

app.post('/embedding', async (req, res) => {
  const query = req.body.query;
  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const embedding = await processQuery(query);
    res.json({ embedding: embedding });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to process query' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});