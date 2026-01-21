/**
 * Redash API Client
 * Provides type-safe access to Redash REST API endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

// ============================================================================
// Type Definitions
// ============================================================================

export interface Query {
  id: number;
  name: string;
  description: string;
  query: string;
  data_source_id: number;
  latest_query_data_id: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  runtime: number;
  options: any;
  visualizations: Visualization[];
}

export interface Visualization {
  id: number;
  type: string;
  name: string;
  description: string;
  options: any;
  query_id: number;
}

export interface QueryResult {
  id: number;
  query_id: number;
  data_source_id: number;
  query_hash: string;
  query: string;
  data: {
    columns: Array<{ name: string; type: string; friendly_name: string }>;
    rows: Array<Record<string, any>>;
  };
  runtime: number;
  retrieved_at: string;
}

export interface Dashboard {
  id: number;
  name: string;
  slug: string;
  tags: string[];
  is_archived: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  dashboard_filters_enabled: boolean;
  widgets: Array<{
    id: number;
    visualization?: {
      id: number;
      type: string;
      name: string;
      description: string;
      options: any;
      query_id: number;
    };
    text?: string;
    width: number;
    options: any;
    dashboard_id: number;
  }>;
}

export interface QueryCreateParams {
  name: string;
  data_source_id: number;
  query: string;
  description?: string;
  options?: any;
  schedule?: any;
  tags?: string[];
}

export interface QueryUpdateParams {
  name?: string;
  data_source_id?: number;
  query?: string;
  description?: string;
  options?: any;
  schedule?: any;
  tags?: string[];
  is_archived?: boolean;
  is_draft?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  page: number;
  pageSize: number;
  results: T[];
}

// ============================================================================
// API Client Configuration
// ============================================================================

interface ClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

function loadConfiguration(): ClientConfig {
  const baseUrl = process.env.REDASH_URL || '';
  const apiKey = process.env.REDASH_API_KEY || '';
  const timeout = parseInt(process.env.REDASH_TIMEOUT || '30000');

  if (!baseUrl || !apiKey) {
    throw new Error('REDASH_URL and REDASH_API_KEY must be provided in .env file');
  }

  return { baseUrl, apiKey, timeout };
}

function createHttpClient(config: ClientConfig): AxiosInstance {
  return axios.create({
    baseURL: config.baseUrl,
    headers: {
      Authorization: `Key ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: config.timeout,
  });
}

// ============================================================================
// Error Handling
// ============================================================================

function handleApiError(error: unknown, context: string): never {
  logger.error(`${context}: ${error}`);

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    if (axiosErr.response) {
      throw new Error(
        `${context} (${axiosErr.response.status}): ${JSON.stringify(axiosErr.response.data)}`
      );
    } else if (axiosErr.request) {
      throw new Error(`${context}: No response from server`);
    }
  }

  throw new Error(`${context}: ${error instanceof Error ? error.message : String(error)}`);
}

// ============================================================================
// API Functions
// ============================================================================

const config = loadConfiguration();
const httpClient = createHttpClient(config);

/**
 * Fetch paginated list of queries with optional filtering
 */
export async function fetchQueries(
  page = 1,
  pageSize = 25,
  tags?: string[],
  search?: string
): Promise<PaginatedResponse<Query>> {
  try {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
    };

    if (tags && tags.length > 0) {
      params.tags = tags.join(',');
    }

    if (search) {
      params.q = search;
    }

    const response = await httpClient.get('/api/queries', { params });

    return {
      count: response.data.count,
      page: response.data.page,
      pageSize: response.data.page_size,
      results: response.data.results,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch queries');
  }
}

/**
 * Retrieve a single query by ID
 */
export async function fetchQueryById(queryId: number): Promise<Query> {
  try {
    const response = await httpClient.get(`/api/queries/${queryId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch query ${queryId}`);
  }
}

/**
 * Create a new query
 */
export async function createQuery(params: QueryCreateParams): Promise<Query> {
  try {
    logger.info(`Creating query: ${params.name}`);

    const payload = {
      name: params.name,
      data_source_id: params.data_source_id,
      query: params.query,
      description: params.description || '',
      options: params.options || {},
      schedule: params.schedule || null,
      tags: params.tags || [],
    };

    const response = await httpClient.post('/api/queries', payload);
    logger.info(`Query created with ID: ${response.data.id}`);

    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to create query');
  }
}

/**
 * Update an existing query
 */
export async function updateQuery(queryId: number, params: QueryUpdateParams): Promise<Query> {
  try {
    logger.debug(`Updating query ${queryId}`);

    const payload: Record<string, any> = {};

    if (params.name !== undefined) payload.name = params.name;
    if (params.data_source_id !== undefined) payload.data_source_id = params.data_source_id;
    if (params.query !== undefined) payload.query = params.query;
    if (params.description !== undefined) payload.description = params.description;
    if (params.options !== undefined) payload.options = params.options;
    if (params.schedule !== undefined) payload.schedule = params.schedule;
    if (params.tags !== undefined) payload.tags = params.tags;
    if (params.is_archived !== undefined) payload.is_archived = params.is_archived;
    if (params.is_draft !== undefined) payload.is_draft = params.is_draft;

    const response = await httpClient.post(`/api/queries/${queryId}`, payload);
    logger.debug(`Query ${queryId} updated`);

    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to update query ${queryId}`);
  }
}

/**
 * Archive (soft delete) a query
 */
export async function archiveQuery(queryId: number): Promise<{ success: boolean }> {
  try {
    logger.debug(`Archiving query ${queryId}`);
    await httpClient.delete(`/api/queries/${queryId}`);
    logger.debug(`Query ${queryId} archived`);

    return { success: true };
  } catch (error) {
    return handleApiError(error, `Failed to archive query ${queryId}`);
  }
}

/**
 * List available data sources
 */
export async function fetchDataSources(): Promise<any[]> {
  try {
    const response = await httpClient.get('/api/data_sources');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch data sources');
  }
}

/**
 * Get all query tags with usage counts
 */
export async function fetchQueryTags(): Promise<Array<{ name: string; count: number }>> {
  try {
    const response = await httpClient.get('/api/queries/tags');

    if (Array.isArray(response.data)) {
      return response.data.map((tag: any) => ({
        name: tag.name || tag,
        count: tag.count || 0,
      }));
    }

    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch query tags');
  }
}

/**
 * Retrieve cached query results without re-execution
 */
export async function fetchCachedResults(
  queryId: number,
  maxAge = 86400
): Promise<QueryResult | null> {
  try {
    const response = await httpClient.post(`/api/queries/${queryId}/results`, {
      max_age: maxAge,
    });

    if (response.data.job) {
      return null;
    }

    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to get cached results for query ${queryId}`);
  }
}

/**
 * Execute a query and wait for results
 */
export async function executeQuery(
  queryId: number,
  parameters?: Record<string, any>
): Promise<QueryResult> {
  try {
    const response = await httpClient.post(`/api/queries/${queryId}/results`, { parameters });

    if (response.data.job) {
      return await waitForJobCompletion(response.data.job.id);
    }

    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to execute query ${queryId}`);
  }
}

/**
 * Poll for job completion
 */
async function waitForJobCompletion(
  jobId: string,
  timeout = 60000,
  interval = 1000
): Promise<QueryResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await httpClient.get(`/api/jobs/${jobId}`);

      if (response.data.job.status === 3) {
        return response.data.job.result;
      } else if (response.data.job.status === 4) {
        throw new Error(`Query execution failed: ${response.data.job.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      return handleApiError(error, `Failed to poll job ${jobId}`);
    }
  }

  /* istanbul ignore next */
  throw new Error(`Query execution timed out after ${timeout}ms`);
}

/**
 * Fetch paginated list of dashboards
 */
export async function fetchDashboards(
  page = 1,
  pageSize = 25
): Promise<PaginatedResponse<Dashboard>> {
  try {
    const response = await httpClient.get('/api/dashboards', {
      params: { page, page_size: pageSize },
    });

    return {
      count: response.data.count,
      page: response.data.page,
      pageSize: response.data.page_size,
      results: response.data.results,
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch dashboards');
  }
}

/**
 * Retrieve a single dashboard by ID
 */
export async function fetchDashboardById(dashboardId: number): Promise<Dashboard> {
  try {
    const response = await httpClient.get(`/api/dashboards/${dashboardId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch dashboard ${dashboardId}`);
  }
}

// ============================================================================
// Legacy Class-based API (for backward compatibility)
// ============================================================================

export class RedashClient {
  async getQueries(page = 1, pageSize = 25, tags?: string[], search?: string) {
    return fetchQueries(page, pageSize, tags, search);
  }

  async getQuery(queryId: number) {
    return fetchQueryById(queryId);
  }

  async createQuery(queryData: QueryCreateParams) {
    return createQuery(queryData);
  }

  async updateQuery(queryId: number, queryData: QueryUpdateParams) {
    return updateQuery(queryId, queryData);
  }

  async archiveQuery(queryId: number) {
    return archiveQuery(queryId);
  }

  async getDataSources() {
    return fetchDataSources();
  }

  async getQueryTags() {
    return fetchQueryTags();
  }

  async getQueryResults(queryId: number, maxAge = 86400) {
    return fetchCachedResults(queryId, maxAge);
  }

  async executeQuery(queryId: number, parameters?: Record<string, any>) {
    return executeQuery(queryId, parameters);
  }

  async getDashboards(page = 1, pageSize = 25) {
    return fetchDashboards(page, pageSize);
  }

  async getDashboard(dashboardId: number) {
    return fetchDashboardById(dashboardId);
  }
}

export const redashClient = new RedashClient();
