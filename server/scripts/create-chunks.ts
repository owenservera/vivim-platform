import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

const CHUNK_SIZE = 400;
const BATCH_SIZE = 50;

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    let chunk = text.slice(start, end);
    if (start + CHUNK_SIZE < text.length) {
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > CHUNK_SIZE * 0.7) chunk = chunk.slice(0, lastNewline);
    }
    if (chunk.trim().length > 50) chunks.push(chunk.trim());
    start += chunk.length - 50;
    if (start >= text.length) break;
  }
  return chunks;
}

try {
  const docs = await client.query('SELECT id, title, "rawContent", category FROM corpus_documents');
  console.log('Found', docs.rows.length, 'documents');

  let totalChunks = 0;
  
  for (const doc of docs.rows) {
    const chunks = chunkText(doc.rawContent);
    const values = [];
    const params = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const summary = chunks[i].match(/^#+\s+(.+)/)?.[1]?.slice(0, 100) || chunks[i].slice(0, 100);
      const idx = params.length;
      params.push(
        'ac905297-af5f-483a-a18f-07fc4ac1348c',
        doc.id,
        chunks[i],
        summary,
        i,
        chunks.length,
        chunks[i].includes('```') ? 'mixed' : 'prose',
        doc.category
      );
      values.push(`($${idx+1}, $${idx+2}, $${idx+3}, $${idx+4}, $${idx+5}, $${idx+6}, $${idx+7}, $${idx+8}, NOW())`);
    }
    
    if (values.length > 0) {
      const sql = `INSERT INTO corpus_chunks ("tenantId", "documentId", content, summary, "chunkIndex", "totalChunks", "contentType", "topicSlug", "sourceUpdatedAt") VALUES ${values.join(', ')}`;
      await client.query(sql, params);
    }
    
    totalChunks += chunks.length;
    console.log(doc.title, '->', chunks.length, 'chunks');
  }
  
  console.log('Total:', totalChunks, 'chunks created');
} finally {
  await client.end();
}
