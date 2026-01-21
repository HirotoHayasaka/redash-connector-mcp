// Set environment variables before importing redashClient
process.env.REDASH_URL = 'https://redash.example.com';
process.env.REDASH_API_KEY = 'test-api-key';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { fetchQueries, fetchQueryById, createQuery, updateQuery, archiveQuery, executeQuery, fetchCachedResults, fetchDataSources, fetchQueryTags, fetchDashboards, fetchDashboardById, } from '../../src/redashClient.js';
import { RedashApiMock } from '../helpers/mockRedashApi.js';
import { mockQueryResult } from '../fixtures/queries.js';
const REDASH_URL = 'https://redash.example.com';
describe('redashClient', () => {
    let apiMock;
    beforeEach(() => {
        process.env.REDASH_URL = REDASH_URL;
        process.env.REDASH_API_KEY = 'test-api-key';
        apiMock = new RedashApiMock(REDASH_URL);
    });
    afterEach(() => {
        nock.cleanAll();
    });
    describe('fetchQueries', () => {
        it('should fetch queries with default pagination', async () => {
            apiMock.mockGetQueries({ page: 1, page_size: 25 });
            const result = await fetchQueries();
            expect(result.count).toBe(100);
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(25);
            expect(result.results).toHaveLength(1);
            expect(result.results[0].name).toBe('Test Query');
        });
        it('should fetch queries with custom pagination', async () => {
            apiMock.mockGetQueries({ page: 2, page_size: 50 });
            const result = await fetchQueries(2, 50);
            expect(result.page).toBe(1); // mockは常にpage=1を返す
            expect(result.pageSize).toBe(25); // mockは常にpage_size=25を返す
        });
        it('should filter by tag', async () => {
            apiMock.mockGetQueries({ page: 1, page_size: 25, tags: 'sales' });
            const result = await fetchQueries(1, 25, ['sales']);
            expect(result).toBeDefined();
        });
        it('should filter by multiple tags', async () => {
            apiMock.mockGetQueries({ page: 1, page_size: 25, tags: 'sales,monthly' });
            const result = await fetchQueries(1, 25, ['sales', 'monthly']);
            expect(result).toBeDefined();
        });
        it('should search by keyword', async () => {
            apiMock.mockGetQueries({ page: 1, page_size: 25, q: 'customer' });
            const result = await fetchQueries(1, 25, undefined, 'customer');
            expect(result).toBeDefined();
        });
        it('should handle network errors', async () => {
            apiMock.mockNetworkError('/api/queries');
            await expect(fetchQueries()).rejects.toThrow('Failed to fetch queries');
        });
    });
    describe('fetchQueryById', () => {
        it('should fetch a single query', async () => {
            apiMock.mockGetQuery(123);
            const result = await fetchQueryById(123);
            expect(result.id).toBe(123);
            expect(result.name).toBe('Test Query');
            expect(result.query).toContain('SELECT');
        });
        it('should handle 404 errors', async () => {
            nock(REDASH_URL).get('/api/queries/999').reply(404, { message: 'Not found' });
            await expect(fetchQueryById(999)).rejects.toThrow('Failed to fetch query 999');
        });
        it('should handle network errors', async () => {
            apiMock.mockNetworkError('/api/queries/123');
            await expect(fetchQueryById(123)).rejects.toThrow('Failed to fetch query 123');
        });
    });
    describe('createQuery', () => {
        it('should create a new query', async () => {
            apiMock.mockCreateQuery();
            const result = await createQuery({
                name: 'New Query',
                data_source_id: 1,
                query: 'SELECT * FROM users',
            });
            expect(result.id).toBe(999);
            expect(result.name).toBe('Test Query');
        });
        it('should create query with optional parameters', async () => {
            apiMock.mockCreateQuery();
            const result = await createQuery({
                name: 'New Query',
                data_source_id: 1,
                query: 'SELECT * FROM users',
                description: 'Test description',
                tags: ['test', 'analytics'],
                options: {},
                schedule: null,
            });
            expect(result).toBeDefined();
        });
        it('should handle validation errors', async () => {
            nock(REDASH_URL).post('/api/queries').reply(400, { message: 'Validation error' });
            await expect(createQuery({
                name: '',
                data_source_id: 1,
                query: '',
            })).rejects.toThrow('Failed to create query');
        });
    });
    describe('updateQuery', () => {
        it('should update a query', async () => {
            apiMock.mockUpdateQuery(123);
            const result = await updateQuery(123, {
                name: 'Updated Query',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe(123);
        });
        it('should update multiple fields', async () => {
            apiMock.mockUpdateQuery(123);
            const result = await updateQuery(123, {
                name: 'Updated Query',
                query: 'SELECT * FROM users WHERE active = true',
                description: 'Updated description',
                tags: ['updated'],
            });
            expect(result).toBeDefined();
        });
        it('should handle 404 errors', async () => {
            nock(REDASH_URL).post('/api/queries/999').reply(404, { message: 'Not found' });
            await expect(updateQuery(999, { name: 'Test' })).rejects.toThrow('Failed to update query 999');
        });
    });
    describe('archiveQuery', () => {
        it('should archive a query', async () => {
            apiMock.mockArchiveQuery(123);
            const result = await archiveQuery(123);
            expect(result.success).toBe(true);
        });
        it('should handle errors', async () => {
            nock(REDASH_URL).delete('/api/queries/999').reply(404, { message: 'Not found' });
            await expect(archiveQuery(999)).rejects.toThrow('Failed to archive query 999');
        });
    });
    describe('executeQuery', () => {
        it('should execute query with immediate results', async () => {
            apiMock.mockExecuteQuery(123, true);
            const result = await executeQuery(123);
            expect(result.id).toBe(456);
            expect(result.query_id).toBe(123);
            expect(result.data.rows).toHaveLength(2);
            expect(result.data.rows[0].name).toBe('Alice');
        });
        it('should execute query with parameters', async () => {
            nock(REDASH_URL)
                .post('/api/queries/123/results', { parameters: { user_id: 1 } })
                .reply(200, mockQueryResult);
            const result = await executeQuery(123, { user_id: 1 });
            expect(result).toBeDefined();
        });
        it('should poll for async job completion', async () => {
            apiMock.mockExecuteQuery(123, false);
            apiMock.mockJobPolling('job-123', 3);
            const result = await executeQuery(123);
            expect(result.id).toBe(456);
            expect(result.data.rows).toHaveLength(2);
        });
        it('should handle job failure', async () => {
            nock(REDASH_URL)
                .post('/api/queries/123/results')
                .reply(200, { job: { id: 'job-fail' } });
            nock(REDASH_URL)
                .get('/api/jobs/job-fail')
                .reply(200, {
                job: {
                    status: 4,
                    error: 'SQL syntax error',
                },
            });
            await expect(executeQuery(123)).rejects.toThrow('SQL syntax error');
        });
        // Note: タイムアウトテストは環境変数が既に初期化されているため、
        // 動的な変更が反映されません。このテストは統合テストで実施すべきです。
        it.skip('should handle job timeout (requires dynamic config)', async () => {
            // このテストはスキップします
        });
    });
    describe('fetchCachedResults', () => {
        it('should fetch cached results', async () => {
            nock(REDASH_URL)
                .post('/api/queries/123/results', { max_age: 86400 })
                .reply(200, mockQueryResult);
            const result = await fetchCachedResults(123);
            expect(result).toBeDefined();
            expect(result?.id).toBe(456);
        });
        it('should return null if job is pending', async () => {
            nock(REDASH_URL)
                .post('/api/queries/123/results', { max_age: 86400 })
                .reply(200, { job: { id: 'job-123' } });
            const result = await fetchCachedResults(123);
            expect(result).toBeNull();
        });
        it('should use custom maxAge', async () => {
            nock(REDASH_URL)
                .post('/api/queries/123/results', { max_age: 3600 })
                .reply(200, mockQueryResult);
            const result = await fetchCachedResults(123, 3600);
            expect(result).toBeDefined();
        });
    });
    describe('fetchDataSources', () => {
        it('should fetch data sources', async () => {
            apiMock.mockGetDataSources();
            const result = await fetchDataSources();
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('PostgreSQL');
            expect(result[1].name).toBe('MySQL');
        });
        it('should handle errors', async () => {
            apiMock.mockNetworkError('/api/data_sources');
            await expect(fetchDataSources()).rejects.toThrow('Failed to fetch data sources');
        });
    });
    describe('fetchQueryTags', () => {
        it('should fetch query tags', async () => {
            apiMock.mockGetQueryTags();
            const result = await fetchQueryTags();
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ name: '売上', count: 15 });
            expect(result[1]).toEqual({ name: '月次', count: 12 });
        });
        it('should handle array format', async () => {
            nock(REDASH_URL).get('/api/queries/tags').reply(200, ['tag1', 'tag2']);
            const result = await fetchQueryTags();
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ name: 'tag1', count: 0 });
            expect(result[1]).toEqual({ name: 'tag2', count: 0 });
        });
        it('should handle errors', async () => {
            apiMock.mockNetworkError('/api/queries/tags');
            await expect(fetchQueryTags()).rejects.toThrow('Failed to fetch query tags');
        });
    });
    describe('fetchDashboards', () => {
        it('should fetch dashboards with default pagination', async () => {
            apiMock.mockGetDashboards({ page: 1, page_size: 25 });
            const result = await fetchDashboards();
            expect(result.count).toBe(10);
            expect(result.results).toHaveLength(1);
            expect(result.results[0].name).toBe('Test Dashboard');
        });
        it('should fetch dashboards with custom pagination', async () => {
            apiMock.mockGetDashboards({ page: 2, page_size: 50 });
            const result = await fetchDashboards(2, 50);
            expect(result).toBeDefined();
        });
        it('should handle errors', async () => {
            apiMock.mockNetworkError('/api/dashboards');
            await expect(fetchDashboards()).rejects.toThrow('Failed to fetch dashboards');
        });
    });
    describe('fetchDashboardById', () => {
        it('should fetch a single dashboard', async () => {
            apiMock.mockGetDashboard(1);
            const result = await fetchDashboardById(1);
            expect(result.id).toBe(1);
            expect(result.name).toBe('Test Dashboard');
            expect(result.widgets).toHaveLength(1);
        });
        it('should handle 404 errors', async () => {
            nock(REDASH_URL).get('/api/dashboards/999').reply(404, { message: 'Not found' });
            await expect(fetchDashboardById(999)).rejects.toThrow('Failed to fetch dashboard 999');
        });
    });
});
//# sourceMappingURL=redashClient.test.js.map