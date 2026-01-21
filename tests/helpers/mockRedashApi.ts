import nock from 'nock';
import {
  mockQuery,
  mockQueryResult,
  mockQueriesList,
  mockDashboard,
  mockDataSources,
  mockQueryTags,
} from '../fixtures/queries.js';

export class RedashApiMock {
  constructor(private baseUrl: string) {}

  mockGetQueries(params?: { page?: number; tags?: string; search?: string }) {
    return nock(this.baseUrl)
      .get('/api/queries')
      .query(params || true)
      .reply(200, mockQueriesList);
  }

  mockGetQuery(queryId: number) {
    return nock(this.baseUrl).get(`/api/queries/${queryId}`).reply(200, mockQuery);
  }

  mockExecuteQuery(queryId: number, immediate = true) {
    if (immediate) {
      return nock(this.baseUrl).post(`/api/queries/${queryId}/results`).reply(200, mockQueryResult);
    } else {
      // Mock async job
      return nock(this.baseUrl)
        .post(`/api/queries/${queryId}/results`)
        .reply(200, { job: { id: 'job-123' } });
    }
  }

  mockJobPolling(jobId: string, iterations = 3) {
    const mock = nock(this.baseUrl);

    for (let i = 0; i < iterations - 1; i++) {
      mock.get(`/api/jobs/${jobId}`).reply(200, { job: { status: 2 } });
    }

    mock.get(`/api/jobs/${jobId}`).reply(200, {
      job: { status: 3, result: mockQueryResult },
    });

    return mock;
  }

  mockCreateQuery() {
    return nock(this.baseUrl)
      .post('/api/queries')
      .reply(201, { ...mockQuery, id: 999 });
  }

  mockUpdateQuery(queryId: number) {
    return nock(this.baseUrl).post(`/api/queries/${queryId}`).reply(200, mockQuery);
  }

  mockArchiveQuery(queryId: number) {
    return nock(this.baseUrl).delete(`/api/queries/${queryId}`).reply(200, { success: true });
  }

  mockGetDataSources() {
    return nock(this.baseUrl).get('/api/data_sources').reply(200, mockDataSources);
  }

  mockGetQueryTags() {
    return nock(this.baseUrl).get('/api/queries/tags').reply(200, mockQueryTags);
  }

  mockGetDashboards(params?: { page?: number; page_size?: number }) {
    return nock(this.baseUrl)
      .get('/api/dashboards')
      .query(params || true)
      .reply(200, {
        count: 10,
        page: 1,
        page_size: 25,
        results: [mockDashboard],
      });
  }

  mockGetDashboard(dashboardId: number) {
    return nock(this.baseUrl).get(`/api/dashboards/${dashboardId}`).reply(200, mockDashboard);
  }

  mockNetworkError(endpoint: string) {
    return nock(this.baseUrl).get(endpoint).replyWithError('Network connection failed');
  }

  mockTimeout(endpoint: string) {
    return nock(this.baseUrl).get(endpoint).delayConnection(35000).reply(200, {});
  }
}
