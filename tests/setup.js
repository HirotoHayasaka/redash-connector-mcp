// Set environment variables before any imports
process.env.REDASH_URL = 'https://redash.example.com';
process.env.REDASH_API_KEY = 'test-api-key';
process.env.REDASH_TIMEOUT = '30000';
import { beforeAll, afterAll, afterEach } from 'vitest';
import nock from 'nock';
beforeAll(() => {
    // HTTPモックを有効化（外部通信を禁止）
    nock.disableNetConnect();
    // localhost接続は許可（必要な場合）
    nock.enableNetConnect('127.0.0.1');
});
afterEach(() => {
    // 各テスト後にモックをクリア
    nock.cleanAll();
});
afterAll(() => {
    // HTTP接続を復元
    nock.restore();
});
//# sourceMappingURL=setup.js.map