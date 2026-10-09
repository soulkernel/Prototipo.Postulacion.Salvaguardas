import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const source = process.argv[2];
const output = process.argv[3];
if (!source || !output) throw new Error('Usage: node prepare-corpus.mjs source.jsonl output.json');
const input = await readFile(source, 'utf8');
const rows = input.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line));
const items = [];
const keys = new Set();
const documents = new Map();
for (const row of rows) {
  const texts = documents.get(row.document_id) || [];
  texts.push(`${row.chunk_id}\n${row.text}`);
  documents.set(row.document_id, texts);
}
const hashes = new Map([...documents].map(([id,texts]) => [id,createHash('sha256').update(texts.join('\n')).digest('hex')]));
for(const row of rows) {
  if(!row.document_id || !row.chunk_id || typeof row.text !== 'string') throw new Error('Invalid source');
  const hash = hashes.get(row.document_id);
  // Preserve source chunk id; conservative short windows reduce E5 truncation risk.
  // Token-length validation with the E5 tokenizer is still required before approval.
  for(let start = 0, part = 1; start < row.text.length; start += 700, part++) {
    const content = row.text.slice(start, start + 800).trim();
    if(!content) continue;
    const pages = [...content.matchAll(/<!--\s*page:\s*(\d+)\s*-->/g)].map(m=>m[1]);
    const locator = `${row.chunk_id} / part ${part} / chars ${start}-${Math.min(start+800,row.text.length)}${pages.length ? ' / page markers '+pages.join(',') : ''}`;
    const key = row.document_id + '|' + locator;
    if(keys.has(key)) throw new Error('Duplicate locator');
    keys.add(key);
    items.push({document_name: row.document_id, document_version: 'corpus-'+hash.slice(0,16), locator,
      content, source_kind: 'unclassified'});
  }
}
await mkdir(path.dirname(output), {recursive:true});
await writeFile(output, JSON.stringify(items), 'utf8');
console.log(JSON.stringify({source_rows:rows.length, prepared_fragments:items.length, documents:new Set(rows.map(r=>r.document_id)).size, output, status:'pending_source_classification_and_technical_approval'}));
