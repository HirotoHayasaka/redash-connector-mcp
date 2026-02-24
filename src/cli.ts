#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import * as path from 'path';

// .env 読み込み
const possibleEnvPaths = [
  '.env',
  path.join(process.cwd(), '.env'),
  path.join(process.env.HOME || '~', '.env'),
];

for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    break;
  }
}

// 必須環境変数バリデーション
const requiredVars = ['REDASH_URL', 'REDASH_API_KEY'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('');
  console.error('  REDASH_URL=https://your-redash-instance.com');
  console.error('  REDASH_API_KEY=your_api_key');
  process.exit(1);
}

// dynamic import で環境変数セット後にモジュール読み込み
const { startServer } = await import('./index.js');
startServer();
