// Set environment variables before importing
process.env.REDASH_URL = 'https://redash.example.com';
process.env.REDASH_API_KEY = 'test-api-key';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import {
  createTextResponse,
  createErrorResponse,
  formatJson,
  handlers,
  schemas,
  listResources,
  readResource,
} from '../../src/index.js';
import { RedashApiMock } from '../helpers/mockRedashApi.js';

const REDASH_URL = 'https://redash.example.com';

describe('index.ts', () => {
  let apiMock: RedashApiMock;

  beforeEach(() => {
    apiMock = new RedashApiMock(REDASH_URL);
  });

  afterEach(() => {
    nock.cleanAll();
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

  describe('resource handlers', () => {
    describe('listResources', () => {
      it('should list all queries and dashboards as resources', async () => {
        // Mock queries
        apiMock.mockGetQueries({ page: 1, page_size: 100 });

        // Mock dashboards
        apiMock.mockGetDashboards({ page: 1, page_size: 100 });

        const result = await listResources();

        expect(result.resources).toBeDefined();
        expect(result.resources.length).toBeGreaterThan(0);

        // Check query resource format
        const queryResource = result.resources.find(r => r.uri.includes('query'));
        expect(queryResource).toBeDefined();
        expect(queryResource?.uri).toMatch(/^redash:\/\/query\/\d+$/);
        expect(queryResource?.name).toBeDefined();

        // Check dashboard resource format
        const dashboardResource = result.resources.find(r => r.uri.includes('dashboard'));
        expect(dashboardResource).toBeDefined();
        expect(dashboardResource?.uri).toMatch(/^redash:\/\/dashboard\/\d+$/);
        expect(dashboardResource?.name).toBeDefined();
      });

      it('should return empty array on error', async () => {
        // Mock network errors
        apiMock.mockNetworkError('/api/queries');

        const result = await listResources();

        expect(result.resources).toEqual([]);
      });
    });

    describe('readResource', () => {
      it('should read query resource by URI', async () => {
        apiMock.mockGetQuery(123);
        apiMock.mockExecuteQuery(123, true);

        const result = await readResource('redash://query/123');

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe('redash://query/123');
        expect(result.contents[0].mimeType).toBe('application/json');

        const data = JSON.parse(result.contents[0].text);
        expect(data.query).toBeDefined();
        expect(data.result).toBeDefined();
        expect(data.query.id).toBe(123);
      });

      it('should read dashboard resource by URI', async () => {
        apiMock.mockGetDashboard(456);

        const result = await readResource('redash://dashboard/456');

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe('redash://dashboard/456');
        expect(result.contents[0].mimeType).toBe('application/json');

        const data = JSON.parse(result.contents[0].text);
        expect(data.id).toBe(1); // mockGetDashboard returns id=1
        expect(data.name).toBe('Test Dashboard');
      });

      it('should throw error for invalid URI format', async () => {
        await expect(readResource('invalid://format')).rejects.toThrow('Invalid resource URI');
      });

      it('should throw error for malformed URI', async () => {
        await expect(readResource('redash://query/abc')).rejects.toThrow();
      });

      it('should throw error for unsupported resource type', async () => {
        // This test is tricky because the regex only matches query|dashboard
        // So an unsupported type would actually fail the regex match first
        // But let's test the error path by using an invalid format
        await expect(readResource('redash://invalid/123')).rejects.toThrow('Invalid resource URI');
      });
    });
  });
});
