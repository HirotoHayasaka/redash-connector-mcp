#!/usr/bin/env node

/**
 * Redash MCP Server
 * Provides Model Context Protocol interface for Redash API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { redashClient, QueryCreateParams, QueryUpdateParams } from './redashClient.js';
import { logger } from './logger.js';

dotenv.config();

// ============================================================================
// Server Configuration
// ============================================================================

const SERVER_CONFIG = {
  name: 'redash-connector-mcp',
  version: '1.0.0',
} as const;

const mcpServer = new Server(SERVER_CONFIG, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

logger.info(`Starting ${SERVER_CONFIG.name} v${SERVER_CONFIG.version}...`);

// ============================================================================
// Utility Functions
// ============================================================================

export function createTextResponse(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  };
}

export function createErrorResponse(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

// ============================================================================
// Tool Schemas
// ============================================================================

export const schemas = {
  'list-queries': z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
    tag: z.string().optional(),
    search: z.string().optional(),
  }),

  'get-query': z.object({
    queryId: z.number(),
  }),

  'create-query': z.object({
    name: z.string(),
    data_source_id: z.number(),
    query: z.string(),
    description: z.string().optional(),
    options: z.any().optional(),
    schedule: z.any().optional(),
    tags: z.array(z.string()).optional(),
  }),

  'update-query': z.object({
    queryId: z.number(),
    name: z.string().optional(),
    data_source_id: z.number().optional(),
    query: z.string().optional(),
    description: z.string().optional(),
    options: z.any().optional(),
    schedule: z.any().optional(),
    tags: z.array(z.string()).optional(),
    is_archived: z.boolean().optional(),
    is_draft: z.boolean().optional(),
  }),

  'archive-query': z.object({
    queryId: z.number(),
  }),

  'list-data-sources': z.object({}),

  'list-query-tags': z.object({}),

  'execute-query': z.object({
    queryId: z.number(),
    parameters: z.record(z.any()).optional(),
  }),

  'get-query-results': z.object({
    queryId: z.number(),
    maxAge: z.number().optional().default(86400),
  }),

  'list-dashboards': z.object({
    page: z.number().optional().default(1),
    pageSize: z.number().optional().default(25),
  }),

  'get-dashboard': z.object({
    dashboardId: z.number(),
  }),
};

// ============================================================================
// Tool Handlers
// ============================================================================

export const handlers = {
  'list-queries': async (params: z.infer<(typeof schemas)['list-queries']>) => {
    try {
      const { page, pageSize, tag, search } = params;
      const tags = tag ? [tag] : undefined;
      const result = await redashClient.getQueries(page, pageSize, tags, search);

      const simplified = {
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        results: result.results.map(q => ({
          id: q.id,
          name: q.name,
          description: q.description,
          data_source_id: q.data_source_id,
          created_at: q.created_at,
          updated_at: q.updated_at,
          is_archived: q.is_archived,
        })),
      };

      return createTextResponse(formatJson(simplified));
    } catch (error) {
      logger.error(`list-queries error: ${error}`);
      return createErrorResponse(
        `Failed to list queries: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'get-query': async (params: z.infer<(typeof schemas)['get-query']>) => {
    try {
      const query = await redashClient.getQuery(params.queryId);
      return createTextResponse(formatJson(query));
    } catch (error) {
      logger.error(`get-query error: ${error}`);
      return createErrorResponse(
        `Failed to get query ${params.queryId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'create-query': async (params: z.infer<(typeof schemas)['create-query']>) => {
    try {
      const queryData: QueryCreateParams = {
        name: params.name,
        data_source_id: params.data_source_id,
        query: params.query,
        description: params.description,
        options: params.options,
        schedule: params.schedule,
        tags: params.tags,
      };

      const result = await redashClient.createQuery(queryData);
      return createTextResponse(formatJson(result));
    } catch (error) {
      logger.error(`create-query error: ${error}`);
      return createErrorResponse(
        `Failed to create query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'update-query': async (params: z.infer<(typeof schemas)['update-query']>) => {
    try {
      const { queryId, ...updateData } = params;
      const queryData: QueryUpdateParams = {};

      if (updateData.name !== undefined) queryData.name = updateData.name;
      if (updateData.data_source_id !== undefined)
        queryData.data_source_id = updateData.data_source_id;
      if (updateData.query !== undefined) queryData.query = updateData.query;
      if (updateData.description !== undefined) queryData.description = updateData.description;
      if (updateData.options !== undefined) queryData.options = updateData.options;
      if (updateData.schedule !== undefined) queryData.schedule = updateData.schedule;
      if (updateData.tags !== undefined) queryData.tags = updateData.tags;
      if (updateData.is_archived !== undefined) queryData.is_archived = updateData.is_archived;
      if (updateData.is_draft !== undefined) queryData.is_draft = updateData.is_draft;

      const result = await redashClient.updateQuery(queryId, queryData);
      return createTextResponse(formatJson(result));
    } catch (error) {
      logger.error(`update-query error: ${error}`);
      return createErrorResponse(
        `Failed to update query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'archive-query': async (params: z.infer<(typeof schemas)['archive-query']>) => {
    try {
      const result = await redashClient.archiveQuery(params.queryId);
      return createTextResponse(formatJson(result));
    } catch (error) {
      logger.error(`archive-query error: ${error}`);
      return createErrorResponse(
        `Failed to archive query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'list-data-sources': async () => {
    try {
      const dataSources = await redashClient.getDataSources();
      return createTextResponse(formatJson(dataSources));
    } catch (error) {
      logger.error(`list-data-sources error: ${error}`);
      return createErrorResponse(
        `Failed to list data sources: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'list-query-tags': async () => {
    try {
      const tags = await redashClient.getQueryTags();
      return createTextResponse(formatJson(tags));
    } catch (error) {
      logger.error(`list-query-tags error: ${error}`);
      return createErrorResponse(
        `Failed to list query tags: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'execute-query': async (params: z.infer<(typeof schemas)['execute-query']>) => {
    try {
      const result = await redashClient.executeQuery(params.queryId, params.parameters);
      return createTextResponse(formatJson(result));
    } catch (error) {
      logger.error(`execute-query error: ${error}`);
      return createErrorResponse(
        `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'get-query-results': async (params: z.infer<(typeof schemas)['get-query-results']>) => {
    try {
      const result = await redashClient.getQueryResults(params.queryId, params.maxAge);

      if (result === null) {
        return createTextResponse(
          `No cached results available for query ${params.queryId} (maxAge: ${params.maxAge}s). ` +
            `Please use execute-query to run the query first.`
        );
      }

      return createTextResponse(formatJson(result));
    } catch (error) {
      logger.error(`get-query-results error: ${error}`);
      return createErrorResponse(
        `Failed to get query results: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'list-dashboards': async (params: z.infer<(typeof schemas)['list-dashboards']>) => {
    try {
      const { page, pageSize } = params;
      const result = await redashClient.getDashboards(page, pageSize);

      const simplified = {
        count: result.count,
        page: result.page,
        pageSize: result.pageSize,
        results: result.results.map(d => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          created_at: d.created_at,
          updated_at: d.updated_at,
          is_archived: d.is_archived,
          is_draft: d.is_draft,
        })),
      };

      return createTextResponse(formatJson(simplified));
    } catch (error) {
      logger.error(`list-dashboards error: ${error}`);
      return createErrorResponse(
        `Failed to list dashboards: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  'get-dashboard': async (params: z.infer<(typeof schemas)['get-dashboard']>) => {
    try {
      const dashboard = await redashClient.getDashboard(params.dashboardId);
      return createTextResponse(formatJson(dashboard));
    } catch (error) {
      logger.error(`get-dashboard error: ${error}`);
      return createErrorResponse(
        `Failed to get dashboard: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};

// ============================================================================
// Tool Definitions
// ============================================================================

const toolDefinitions: Tool[] = [
  {
    name: 'list-queries',
    description:
      'List all available queries in Redash with optional filtering by tag or keyword search',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (starts at 1)' },
        pageSize: { type: 'number', description: 'Number of results per page' },
        tag: { type: 'string', description: 'Filter by tag (single tag name)' },
        search: { type: 'string', description: 'Keyword search in query name and description' },
      },
    },
  },
  {
    name: 'get-query',
    description: 'Get details of a specific query',
    inputSchema: {
      type: 'object',
      properties: {
        queryId: { type: 'number', description: 'ID of the query to get' },
      },
      required: ['queryId'],
    },
  },
  {
    name: 'create-query',
    description: 'Create a new query in Redash',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the query' },
        data_source_id: { type: 'number', description: 'ID of the data source to use' },
        query: { type: 'string', description: 'SQL query text' },
        description: { type: 'string', description: 'Description of the query' },
        options: { type: 'object', description: 'Query options' },
        schedule: { type: 'object', description: 'Query schedule' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the query' },
      },
      required: ['name', 'data_source_id', 'query'],
    },
  },
  {
    name: 'update-query',
    description: 'Update an existing query in Redash',
    inputSchema: {
      type: 'object',
      properties: {
        queryId: { type: 'number', description: 'ID of the query to update' },
        name: { type: 'string', description: 'New name of the query' },
        data_source_id: { type: 'number', description: 'ID of the data source to use' },
        query: { type: 'string', description: 'SQL query text' },
        description: { type: 'string', description: 'Description of the query' },
        options: { type: 'object', description: 'Query options' },
        schedule: { type: 'object', description: 'Query schedule' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the query' },
        is_archived: { type: 'boolean', description: 'Whether the query is archived' },
        is_draft: { type: 'boolean', description: 'Whether the query is a draft' },
      },
      required: ['queryId'],
    },
  },
  {
    name: 'archive-query',
    description: 'Archive (soft-delete) a query in Redash',
    inputSchema: {
      type: 'object',
      properties: {
        queryId: { type: 'number', description: 'ID of the query to archive' },
      },
      required: ['queryId'],
    },
  },
  {
    name: 'list-data-sources',
    description: 'List all available data sources in Redash',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list-query-tags',
    description:
      'List all available query tags in Redash with their usage counts (sorted by usage frequency)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'execute-query',
    description: 'Execute a Redash query and return results',
    inputSchema: {
      type: 'object',
      properties: {
        queryId: { type: 'number', description: 'ID of the query to execute' },
        parameters: {
          type: 'object',
          description: 'Parameters to pass to the query (if any)',
          additionalProperties: true,
        },
      },
      required: ['queryId'],
    },
  },
  {
    name: 'get-query-results',
    description: 'Get cached query results without executing the query',
    inputSchema: {
      type: 'object',
      properties: {
        queryId: { type: 'number', description: 'ID of the query to get cached results for' },
        maxAge: {
          type: 'number',
          description: 'Maximum age of cached results in seconds (default: 86400 = 1 day)',
        },
      },
      required: ['queryId'],
    },
  },
  {
    name: 'list-dashboards',
    description: 'List all available dashboards in Redash',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (starts at 1)' },
        pageSize: { type: 'number', description: 'Number of results per page' },
      },
    },
  },
  {
    name: 'get-dashboard',
    description: 'Get details of a specific dashboard',
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: { type: 'number', description: 'ID of the dashboard to get' },
      },
      required: ['dashboardId'],
    },
  },
];

// ============================================================================
// Resource Handlers
// ============================================================================

export async function listResources() {
  try {
    const queries = await redashClient.getQueries(1, 100);
    const queryResources = queries.results.map(query => ({
      uri: `redash://query/${query.id}`,
      name: query.name,
      description: query.description || `Query ID: ${query.id}`,
    }));

    const dashboards = await redashClient.getDashboards(1, 100);
    const dashboardResources = dashboards.results.map(dashboard => ({
      uri: `redash://dashboard/${dashboard.id}`,
      name: dashboard.name,
      description: `Dashboard ID: ${dashboard.id}`,
    }));

    return {
      resources: [...queryResources, ...dashboardResources],
    };
  } catch (error) {
    logger.error(`Error listing resources: ${error}`);
    return { resources: [] };
  }
}

export async function readResource(uri: string) {
  const match = uri.match(/^redash:\/\/(query|dashboard)\/(\d+)$/);

  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }

  const [, resourceType, resourceId] = match;
  const id = parseInt(resourceId, 10);

  if (resourceType === 'query') {
    const query = await redashClient.getQuery(id);
    const result = await redashClient.executeQuery(id);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: formatJson({ query, result }),
        },
      ],
    };
  } else if (resourceType === 'dashboard') {
    const dashboard = await redashClient.getDashboard(id);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: formatJson(dashboard),
        },
      ],
    };
  }

  throw new Error(`Unsupported resource type: ${resourceType}`);
}

// ============================================================================
// Request Handlers
// ============================================================================

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: toolDefinitions };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  logger.debug(`Tool invoked: ${name}`);

  type ToolName = keyof typeof handlers;
  const toolName = name as ToolName;

  const handler = handlers[toolName];
  if (!handler) {
    logger.error(`Unknown tool: ${name}`);
    return createErrorResponse(`Unknown tool: ${name}`);
  }

  try {
    logger.debug(`Looking for schema: ${toolName}`);
    logger.debug(`Available schemas: ${Object.keys(schemas).join(', ')}`);

    const schema = schemas[toolName];
    if (!schema) {
      logger.error(`Schema not found for tool: ${name}`);
      logger.error(`Available schemas: ${Object.keys(schemas).join(', ')}`);
      return createErrorResponse(`Schema not found for tool: ${name}`);
    }

    const validatedArgs = schema.parse(args);
    return await handler(validatedArgs as any);
  } catch (error) {
    logger.error(`Tool execution failed: ${name} - ${error}`);

    if (error instanceof z.ZodError) {
      return createErrorResponse(`Invalid arguments for ${name}: ${JSON.stringify(error.errors)}`);
    }

    return createErrorResponse(
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

mcpServer.setRequestHandler(ListResourcesRequestSchema, listResources);

mcpServer.setRequestHandler(ReadResourceRequestSchema, async request => {
  try {
    return await readResource(request.params.uri);
  } catch (error) {
    logger.error(`Resource read failed: ${error}`);
    throw error;
  }
});

// ============================================================================
// Server Startup
// ============================================================================

/* istanbul ignore next */
export async function startServer() {
  try {
    const transport = new StdioServerTransport();
    logger.info(`${SERVER_CONFIG.name} starting...`);

    await mcpServer.connect(transport);
    logger.setServer(mcpServer);
    logger.info(`${SERVER_CONFIG.name} connected successfully!`);
  } catch (error) {
    logger.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

/* istanbul ignore next */
// Only start the server when this file is run directly, not when imported for testing
if (
  (process.argv[1] && process.argv[1].endsWith('index.ts')) ||
  process.argv[1]?.endsWith('index.js')
) {
  startServer();
}
