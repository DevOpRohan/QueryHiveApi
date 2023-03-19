// const { Configuration, OpenAIApi } = require('openai');

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(configuration);

// async function createEmbeddings(model, input) {
//   try {
//     console.log(`Creating embeddings for ${input.length} inputs...`)
//     const response = await openai.createEmbedding({ model, input });
//     return response.data.data.map((data) => data.embedding);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     throw error;
//   }
// }

// module.exports = {
//   createEmbeddings,
// };
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function createEmbeddings(model, input) {
  try {
    console.log(`Creating embeddings for ${input.length} inputs...`)
    const response = await openai.createEmbedding({ model, input });
    return response.data.data.map((data) => data.embedding);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createEmbeddings,
};