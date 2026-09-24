import fs from 'fs';

const path = '/tmp/qa-runtime.json';
export const qaRuntime = fs.existsSync(path)
  ? JSON.parse(fs.readFileSync(path, 'utf8'))
  : {};
