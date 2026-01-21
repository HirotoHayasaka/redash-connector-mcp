import nock from 'nock';
export declare class RedashApiMock {
  private baseUrl;
  constructor(baseUrl: string);
  mockGetQueries(params?: { page?: number; tags?: string; search?: string }): nock.Scope;
  mockGetQuery(queryId: number): nock.Scope;
  mockExecuteQuery(queryId: number, immediate?: boolean): nock.Scope;
  mockJobPolling(jobId: string, iterations?: number): nock.Scope;
  mockCreateQuery(): nock.Scope;
  mockUpdateQuery(queryId: number): nock.Scope;
  mockArchiveQuery(queryId: number): nock.Scope;
  mockGetDataSources(): nock.Scope;
  mockGetQueryTags(): nock.Scope;
  mockGetDashboards(params?: { page?: number; page_size?: number }): nock.Scope;
  mockGetDashboard(dashboardId: number): nock.Scope;
  mockNetworkError(endpoint: string): nock.Scope;
  mockTimeout(endpoint: string): nock.Scope;
}
//# sourceMappingURL=mockRedashApi.d.ts.map
