// Howto: Search -> Reranking - TypeScript examples

import assert from 'assert';
import weaviate from 'weaviate-client/node';

const client = await weaviate.connectToWCS(
  'https://hha2nvjsruetknc5vxwrwa.c0.europe-west2.gcp.weaviate.cloud/',
 {
   authCredentials: new weaviate.ApiKey('nMZuw1z1zVtnjkXXOMGx9Ows7YWGsakItdus'),
   headers: {
     'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',  // Replace with your inference API key
     'X-Cohere-Api-Key': process.env.COHERE_API_KEY || '', // Replace with your Cohere API key
   }
 } 
)

let result;

// ==================================
// ===== nearText before rerank =====
// ==================================

// START nearText
const myCollection = client.collections.get('JeopardyQuestion');

const result = await myCollection.query.nearText('flying',{
 returnProperties: ['question', 'answer'],
 returnMetadata: ['distance'],
   limit: 10
})

console.log(JSON.stringify(result, null, 2));


// END nearText

// Tests
let questionKeys = new Set(Object.keys(result.data.Get.JeopardyQuestion[0]));
assert.deepEqual(questionKeys, new Set(['question', 'answer', '_additional']));
assert.equal(result.data.Get.JeopardyQuestion.length, 10);
for (const question of result.data.Get.JeopardyQuestion) {
  assert.ok('distance' in question['_additional']);
}

// =================================
// ===== nearText after rerank =====
// =================================

// START RerankNearText
result = await client.graphql
  .get()
  .withClassName('JeopardyQuestion')
  .withNearText({
    concepts: ['flying'],
  })
  // highlight-start
  .withFields('question answer _additional { distance rerank(property: "answer" query: "floating") { score } }')
  // highlight-end
  .withLimit(10)
  .do();

console.log(JSON.stringify(result, null, 2));
// END RerankNearText

// Tests
questionKeys = new Set(Object.keys(result.data.Get.JeopardyQuestion[0]));
assert.deepEqual(questionKeys, new Set(['question', 'answer', '_additional']));
assert.equal(result.data.Get.JeopardyQuestion.length, 10);
for (const question of result.data.Get.JeopardyQuestion) {
  assert.ok('distance' in question['_additional']);
  assert.ok('score' in question['_additional']['rerank'][0]);
}


// ============================
// ===== bm25 with rerank =====
// ============================

// START bm25Rerank
result = await client.graphql
  .get()
  .withClassName('JeopardyQuestion')
  .withBm25({
    query: 'paper',
  })
  // highlight-start
  .withFields('question answer _additional { distance rerank(property: "question" query: "publication") { score } }')
  // highlight-end
  .withLimit(10)
  .do();

console.log(JSON.stringify(result, null, 2));
// END bm25Rerank

// Tests
questionKeys = new Set(Object.keys(result.data.Get.JeopardyQuestion[0]));
assert.deepEqual(questionKeys, new Set(['question', 'answer', '_additional']));
assert.equal(result.data.Get.JeopardyQuestion.length, 10);
for (const question of result.data.Get.JeopardyQuestion) {
  assert.ok('distance' in question['_additional']);
  assert.ok('score' in question['_additional']['rerank'][0]);
}
