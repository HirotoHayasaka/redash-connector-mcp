export declare const mockQuery: {
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
  options: {};
  visualizations: {
    id: number;
    type: string;
    name: string;
    description: string;
    options: {};
    query_id: number;
  }[];
};
export declare const mockQueryResult: {
  id: number;
  query_id: number;
  data_source_id: number;
  query_hash: string;
  query: string;
  data: {
    columns: {
      name: string;
      type: string;
      friendly_name: string;
    }[];
    rows: {
      id: number;
      name: string;
      email: string;
    }[];
  };
  runtime: number;
  retrieved_at: string;
};
export declare const mockQueriesList: {
  count: number;
  page: number;
  page_size: number;
  results: {
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
    options: {};
    visualizations: {
      id: number;
      type: string;
      name: string;
      description: string;
      options: {};
      query_id: number;
    }[];
  }[];
};
export declare const mockDashboard: {
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
  widgets: {
    id: number;
    visualization: {
      id: number;
      type: string;
      name: string;
      description: string;
      options: {};
      query_id: number;
    };
    width: number;
    options: {};
    dashboard_id: number;
  }[];
};
export declare const mockDataSources: {
  id: number;
  name: string;
  type: string;
  syntax: string;
}[];
export declare const mockQueryTags: {
  name: string;
  count: number;
}[];
//# sourceMappingURL=queries.d.ts.map
