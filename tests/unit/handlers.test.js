// Set environment variables before importing
process.env.REDASH_URL = 'https://redash.example.com';
process.env.REDASH_API_KEY = 'test-api-key';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import nock from 'nock';
import { RedashApiMock } from '../helpers/mockRedashApi.js';
import { redashClient } from '../../src/redashClient.js';
const REDASH_URL = 'https://redash.example.com';
describe('handlers (integration-style tests)', () => {
    let apiMock;
    beforeEach(() => {
        apiMock = new RedashApiMock(REDASH_URL);
    });
    describe('list-queries handler', () => {
        it('should call redashClient.getQueries with correct parameters', async () => {
            const spy = vi.spyOn(redashClient, 'getQueries');
            apiMock.mockGetQueries({ page: 1, page_size: 25 });
            await redashClient.getQueries(1, 25);
            expect(spy).toHaveBeenCalledWith(1, 25);
            spy.mockRestore();
        });
        it('should handle tag filtering', async () => {
            const spy = vi.spyOn(redashClient, 'getQueries');
            apiMock.mockGetQueries({ page: 1, page_size: 25, tags: 'sales' });
            await redashClient.getQueries(1, 25, ['sales']);
            expect(spy).toHaveBeenCalledWith(1, 25, ['sales']);
            spy.mockRestore();
        });
        it('should handle search filtering', async () => {
            const spy = vi.spyOn(redashClient, 'getQueries');
            apiMock.mockGetQueries({ page: 1, page_size: 25, q: 'customer' });
            await redashClient.getQueries(1, 25, undefined, 'customer');
            expect(spy).toHaveBeenCalledWith(1, 25, undefined, 'customer');
            spy.mockRestore();
        });
    });
    describe('get-query handler', () => {
        it('should call redashClient.getQuery with correct ID', async () => {
            const spy = vi.spyOn(redashClient, 'getQuery');
            apiMock.mockGetQuery(123);
            await redashClient.getQuery(123);
            expect(spy).toHaveBeenCalledWith(123);
            spy.mockRestore();
        });
    });
    describe('create-query handler', () => {
        it('should call redashClient.createQuery with correct data', async () => {
            const spy = vi.spyOn(redashClient, 'createQuery');
            apiMock.mockCreateQuery();
            const queryData = {
                name: 'Test Query',
                data_source_id: 1,
                query: 'SELECT * FROM users',
            };
            await redashClient.createQuery(queryData);
            expect(spy).toHaveBeenCalledWith(queryData);
            spy.mockRestore();
        });
    });
    describe('update-query handler', () => {
        it('should call redashClient.updateQuery with correct parameters', async () => {
            const spy = vi.spyOn(redashClient, 'updateQuery');
            apiMock.mockUpdateQuery(123);
            const updateData = { name: 'Updated Query' };
            await redashClient.updateQuery(123, updateData);
            expect(spy).toHaveBeenCalledWith(123, updateData);
            spy.mockRestore();
        });
    });
    describe('archive-query handler', () => {
        it('should call redashClient.archiveQuery with correct ID', async () => {
            const spy = vi.spyOn(redashClient, 'archiveQuery');
            apiMock.mockArchiveQuery(123);
            await redashClient.archiveQuery(123);
            expect(spy).toHaveBeenCalledWith(123);
            spy.mockRestore();
        });
    });
    describe('execute-query handler', () => {
        it('should call redashClient.executeQuery with correct parameters', async () => {
            const spy = vi.spyOn(redashClient, 'executeQuery');
            apiMock.mockExecuteQuery(123);
            await redashClient.executeQuery(123);
            expect(spy).toHaveBeenCalledWith(123);
            spy.mockRestore();
        });
        it('should call redashClient.executeQuery with parameters', async () => {
            const spy = vi.spyOn(redashClient, 'executeQuery');
            nock(REDASH_URL)
                .post('/api/queries/123/results', { parameters: { user_id: 1 } })
                .reply(200, { id: 456, query_id: 123, data: { rows: [], columns: [] } });
            await redashClient.executeQuery(123, { user_id: 1 });
            expect(spy).toHaveBeenCalledWith(123, { user_id: 1 });
            spy.mockRestore();
        });
    });
    describe('get-query-results handler', () => {
        it('should call redashClient.getQueryResults with correct parameters', async () => {
            const spy = vi.spyOn(redashClient, 'getQueryResults');
            nock(REDASH_URL)
                .post('/api/queries/123/results', { max_age: 86400 })
                .reply(200, { id: 456, query_id: 123, data: { rows: [], columns: [] } });
            await redashClient.getQueryResults(123);
            expect(spy).toHaveBeenCalledWith(123);
            spy.mockRestore();
        });
        it('should call with custom maxAge', async () => {
            const spy = vi.spyOn(redashClient, 'getQueryResults');
            nock(REDASH_URL)
                .post('/api/queries/123/results', { max_age: 3600 })
                .reply(200, { id: 456, query_id: 123, data: { rows: [], columns: [] } });
            await redashClient.getQueryResults(123, 3600);
            expect(spy).toHaveBeenCalledWith(123, 3600);
            spy.mockRestore();
        });
    });
    describe('list-dashboards handler', () => {
        it('should call redashClient.getDashboards with correct parameters', async () => {
            const spy = vi.spyOn(redashClient, 'getDashboards');
            apiMock.mockGetDashboards({ page: 1, page_size: 25 });
            await redashClient.getDashboards();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
    describe('get-dashboard handler', () => {
        it('should call redashClient.getDashboard with correct ID', async () => {
            const spy = vi.spyOn(redashClient, 'getDashboard');
            apiMock.mockGetDashboard(1);
            await redashClient.getDashboard(1);
            expect(spy).toHaveBeenCalledWith(1);
            spy.mockRestore();
        });
    });
    describe('list-data-sources handler', () => {
        it('should call redashClient.getDataSources', async () => {
            const spy = vi.spyOn(redashClient, 'getDataSources');
            apiMock.mockGetDataSources();
            await redashClient.getDataSources();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
    describe('list-query-tags handler', () => {
        it('should call redashClient.getQueryTags', async () => {
            const spy = vi.spyOn(redashClient, 'getQueryTags');
            apiMock.mockGetQueryTags();
            await redashClient.getQueryTags();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });
});
//# sourceMappingURL=handlers.test.js.map