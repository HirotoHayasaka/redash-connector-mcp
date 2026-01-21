export const mockQuery = {
  id: 123,
  name: 'Test Query',
  description: 'A test query for unit tests',
  query: 'SELECT * FROM users WHERE id = {{user_id}}',
  data_source_id: 1,
  latest_query_data_id: 456,
  is_archived: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  runtime: 0.523,
  options: {},
  visualizations: [
    {
      id: 789,
      type: 'TABLE',
      name: 'Table Visualization',
      description: '',
      options: {},
      query_id: 123,
    },
  ],
};

export const mockQueryResult = {
  id: 456,
  query_id: 123,
  data_source_id: 1,
  query_hash: 'abc123def456',
  query: 'SELECT * FROM users',
  data: {
    columns: [
      { name: 'id', type: 'integer', friendly_name: 'User ID' },
      { name: 'name', type: 'string', friendly_name: 'User Name' },
      { name: 'email', type: 'string', friendly_name: 'Email' },
    ],
    rows: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
  },
  runtime: 0.523,
  retrieved_at: '2024-01-01T00:00:00Z',
};

export const mockQueriesList = {
  count: 100,
  page: 1,
  page_size: 25,
  results: [mockQuery],
};

export const mockDashboard = {
  id: 1,
  name: 'Test Dashboard',
  slug: 'test-dashboard',
  tags: ['test'],
  is_archived: false,
  is_draft: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  version: 1,
  dashboard_filters_enabled: false,
  widgets: [
    {
      id: 1,
      visualization: {
        id: 789,
        type: 'TABLE',
        name: 'Table Visualization',
        description: '',
        options: {},
        query_id: 123,
      },
      width: 1,
      options: {},
      dashboard_id: 1,
    },
  ],
};

export const mockDataSources = [
  {
    id: 1,
    name: 'PostgreSQL',
    type: 'pg',
    syntax: 'sql',
  },
  {
    id: 2,
    name: 'MySQL',
    type: 'mysql',
    syntax: 'sql',
  },
];

export const mockQueryTags = [
  { name: '売上', count: 15 },
  { name: '月次', count: 12 },
  { name: '分析', count: 8 },
];
