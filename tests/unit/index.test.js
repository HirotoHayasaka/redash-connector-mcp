// Set environment variables before importing
process.env.REDASH_URL = 'https://redash.example.com';
process.env.REDASH_API_KEY = 'test-api-key';
import { describe, it, expect, beforeEach } from 'vitest';
import nock from 'nock';
import { createTextResponse, createErrorResponse, formatJson, handlers, schemas, } from '../../src/index.js';
import { RedashApiMock } from '../helpers/mockRedashApi.js';
const REDASH_URL = 'https://redash.example.com';
describe('index.ts', () => {
    let apiMock;
    beforeEach(() => {
        apiMock = new RedashApiMock(REDASH_URL);
    });
    describe('utility functions', () => {
        it('createTextResponse should create text response', () => {
            const result = createTextResponse('Hello World');
            expect(result).toEqual({
                content: [{ type: 'text', text: 'Hello World' }],
            });
        });
        it('createErrorResponse should create error response', () => {
            const result = createErrorResponse('Error occurred');
            expect(result).toEqual({
                isError: true,
                content: [{ type: 'text', text: 'Error occurred' }],
            });
        });
        it('formatJson should format object as JSON string', () => {
            const data = { foo: 'bar', num: 123 };
            const result = formatJson(data);
            expect(result).toBe('{\n  "foo": "bar",\n  "num": 123\n}');
        });
        it('formatJson should handle arrays', () => {
            const data = [1, 2, 3];
            const result = formatJson(data);
            expect(result).toBe('[\n  1,\n  2,\n  3\n]');
        });
        it('formatJson should handle nested objects', () => {
            const data = { outer: { inner: 'value' } };
            const result = formatJson(data);
            expect(result).toContain('"outer"');
            expect(result).toContain('"inner"');
        });
    });
    describe('schemas', () => {
        it('list-queries schema should have default values', () => {
            const result = schemas['list-queries'].parse({});
            expect(result.page).toBe(1);
            expect(result.pageSize).toBe(25);
        });
        it('get-query schema should require queryId', () => {
            expect(() => schemas['get-query'].parse({})).toThrow();
            const result = schemas['get-query'].parse({ queryId: 123 });
            expect(result.queryId).toBe(123);
        });
        it('create-query schema should validate required fields', () => {
            expect(() => schemas['create-query'].parse({})).toThrow();
            const result = schemas['create-query'].parse({
                name: 'Test',
                data_source_id: 1,
                query: 'SELECT 1',
            });
            expect(result.name).toBe('Test');
        });
    });
    describe('handlers', () => {
        describe('list-queries handler', () => {
            it('should return formatted queries list', async () => {
                apiMock.mockGetQueries({ page: 1, page_size: 25 });
                const result = await handlers['list-queries']({ page: 1, pageSize: 25 });
                expect(result.content).toBeDefined();
                expect(result.content[0].type).toBe('text');
                const data = JSON.parse(result.content[0].text);
                expect(data.count).toBeDefined();
                expect(data.results).toBeDefined();
            });
            it('should handle tag filtering', async () => {
                apiMock.mockGetQueries({ page: 1, page_size: 25, tags: 'sales' });
                const result = await handlers['list-queries']({
                    page: 1,
                    pageSize: 25,
                    tag: 'sales',
                });
                expect(result.content).toBeDefined();
            });
            it('should handle search filtering', async () => {
                apiMock.mockGetQueries({ page: 1, page_size: 25, q: 'customer' });
                const result = await handlers['list-queries']({
                    page: 1,
                    pageSize: 25,
                    search: 'customer',
                });
                expect(result.content).toBeDefined();
            });
            it('should return error on failure', async () => {
                apiMock.mockNetworkError('/api/queries');
                const result = await handlers['list-queries']({ page: 1, pageSize: 25 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to list queries');
            });
        });
        describe('get-query handler', () => {
            it('should return formatted query', async () => {
                apiMock.mockGetQuery(123);
                const result = await handlers['get-query']({ queryId: 123 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBe(123);
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).get('/api/queries/999').reply(404);
                const result = await handlers['get-query']({ queryId: 999 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to get query');
            });
        });
        describe('create-query handler', () => {
            it('should create query and return result', async () => {
                apiMock.mockCreateQuery();
                const result = await handlers['create-query']({
                    name: 'Test Query',
                    data_source_id: 1,
                    query: 'SELECT * FROM users',
                });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBeDefined();
            });
            it('should handle optional parameters', async () => {
                apiMock.mockCreateQuery();
                const result = await handlers['create-query']({
                    name: 'Test Query',
                    data_source_id: 1,
                    query: 'SELECT * FROM users',
                    description: 'Test description',
                    tags: ['test'],
                });
                expect(result.content).toBeDefined();
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).post('/api/queries').reply(400, { message: 'Invalid' });
                const result = await handlers['create-query']({
                    name: '',
                    data_source_id: 1,
                    query: '',
                });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to create query');
            });
        });
        describe('update-query handler', () => {
            it('should update query and return result', async () => {
                apiMock.mockUpdateQuery(123);
                const result = await handlers['update-query']({
                    queryId: 123,
                    name: 'Updated Query',
                });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBe(123);
            });
            it('should handle multiple update fields', async () => {
                apiMock.mockUpdateQuery(123);
                const result = await handlers['update-query']({
                    queryId: 123,
                    name: 'Updated',
                    query: 'SELECT * FROM orders',
                    tags: ['updated'],
                });
                expect(result.content).toBeDefined();
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).post('/api/queries/999').reply(404);
                const result = await handlers['update-query']({
                    queryId: 999,
                    name: 'Test',
                });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to update query');
            });
        });
        describe('archive-query handler', () => {
            it('should archive query', async () => {
                apiMock.mockArchiveQuery(123);
                const result = await handlers['archive-query']({ queryId: 123 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.success).toBe(true);
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).delete('/api/queries/999').reply(404);
                const result = await handlers['archive-query']({ queryId: 999 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to archive query');
            });
        });
        describe('list-data-sources handler', () => {
            it('should return data sources list', async () => {
                apiMock.mockGetDataSources();
                const result = await handlers['list-data-sources']();
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(Array.isArray(data)).toBe(true);
            });
            it('should return error on failure', async () => {
                apiMock.mockNetworkError('/api/data_sources');
                const result = await handlers['list-data-sources']();
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to list data sources');
            });
        });
        describe('list-query-tags handler', () => {
            it('should return tags list', async () => {
                apiMock.mockGetQueryTags();
                const result = await handlers['list-query-tags']();
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(Array.isArray(data)).toBe(true);
            });
            it('should return error on failure', async () => {
                apiMock.mockNetworkError('/api/queries/tags');
                const result = await handlers['list-query-tags']();
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to list query tags');
            });
        });
        describe('execute-query handler', () => {
            it('should execute query and return results', async () => {
                apiMock.mockExecuteQuery(123, true);
                const result = await handlers['execute-query']({ queryId: 123 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBeDefined();
                expect(data.data).toBeDefined();
            });
            it('should execute query with parameters', async () => {
                nock(REDASH_URL)
                    .post('/api/queries/123/results', { parameters: { user_id: 1 } })
                    .reply(200, {
                    id: 456,
                    query_id: 123,
                    data: { rows: [], columns: [] },
                });
                const result = await handlers['execute-query']({
                    queryId: 123,
                    parameters: { user_id: 1 },
                });
                expect(result.content).toBeDefined();
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).post('/api/queries/999/results').reply(404);
                const result = await handlers['execute-query']({ queryId: 999 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to execute query');
            });
        });
        describe('get-query-results handler', () => {
            it('should get cached results', async () => {
                nock(REDASH_URL)
                    .post('/api/queries/123/results', { max_age: 86400 })
                    .reply(200, {
                    id: 456,
                    query_id: 123,
                    data: { rows: [], columns: [] },
                });
                const result = await handlers['get-query-results']({ queryId: 123, maxAge: 86400 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBeDefined();
            });
            it('should return message when no cached results available', async () => {
                nock(REDASH_URL)
                    .post('/api/queries/123/results', { max_age: 86400 })
                    .reply(200, { job: { id: 'job-123' } });
                const result = await handlers['get-query-results']({ queryId: 123, maxAge: 86400 });
                expect(result.content).toBeDefined();
                expect(result.content[0].text).toContain('No cached results available');
            });
            it('should use custom maxAge', async () => {
                nock(REDASH_URL)
                    .post('/api/queries/123/results', { max_age: 3600 })
                    .reply(200, {
                    id: 456,
                    query_id: 123,
                    data: { rows: [], columns: [] },
                });
                const result = await handlers['get-query-results']({ queryId: 123, maxAge: 3600 });
                expect(result.content).toBeDefined();
            });
            it('should return error on failure', async () => {
                apiMock.mockNetworkError('/api/queries/123/results');
                const result = await handlers['get-query-results']({ queryId: 123, maxAge: 86400 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to get query results');
            });
        });
        describe('list-dashboards handler', () => {
            it('should return dashboards list', async () => {
                apiMock.mockGetDashboards({ page: 1, page_size: 25 });
                const result = await handlers['list-dashboards']({ page: 1, pageSize: 25 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.count).toBeDefined();
                expect(data.results).toBeDefined();
            });
            it('should return error on failure', async () => {
                apiMock.mockNetworkError('/api/dashboards');
                const result = await handlers['list-dashboards']({ page: 1, pageSize: 25 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to list dashboards');
            });
        });
        describe('get-dashboard handler', () => {
            it('should return dashboard details', async () => {
                apiMock.mockGetDashboard(1);
                const result = await handlers['get-dashboard']({ dashboardId: 1 });
                expect(result.content).toBeDefined();
                const data = JSON.parse(result.content[0].text);
                expect(data.id).toBe(1);
            });
            it('should return error on failure', async () => {
                nock(REDASH_URL).get('/api/dashboards/999').reply(404);
                const result = await handlers['get-dashboard']({ dashboardId: 999 });
                expect(result.isError).toBe(true);
                expect(result.content[0].text).toContain('Failed to get dashboard');
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map