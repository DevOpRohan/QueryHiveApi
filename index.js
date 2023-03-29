require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createEmbeddings } = require('./openaiApi');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

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
    } else if (line.startsWith('$$')) {
      currentHeading = line.substring(2, line.indexOf(':'));
      currentContent = '';
    } else {
      currentContent += line;
      if (i === lines.length - 1 || lines[i + 1].startsWith('##') || lines[i + 1].startsWith('$$')) {
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

  return sections.map((section, index) => ({
    index,
    title: section.title,
    heading: section.heading,
    content: section.content,
    embedding: embeddings[index],
  }));
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

app.get('/embedding', async (req, res) => {
  const {query} = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    const embedding = await processQuery(query.toString());
    res.json({ embedding: embedding });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to process query' });
  }
});

app.get("/answer", async(req, res) => {
  const {q} = req.query;
  console.log(q);
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt:""+q,
    temperature: 0,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });
  console.log(response.data.choices[0].text);
  res.send(response.data.choices[0].text);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
