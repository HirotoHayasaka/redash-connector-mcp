# redash-connector-mcp

[![npm version](https://badge.fury.io/js/redash-connector-mcp.svg)](https://www.npmjs.com/package/redash-connector-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-86%25-green.svg)](./coverage)

A Model Context Protocol (MCP) server that enables seamless integration between [Redash](https://redash.io/) and Claude AI (Desktop & Code). Query your data warehouse, manage queries, and execute analytics workflows directly through natural language conversations with Claude.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Quick Start (Claude MCP Add)](#quick-start-claude-mcp-add)
  - [Manual Installation](#manual-installation)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Getting Your Redash API Key](#getting-your-redash-api-key)
- [Usage](#usage)
  - [Example Conversations](#example-conversations)
- [Available Tools](#available-tools)
- [MCP Resources](#mcp-resources)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Testing](#testing)
  - [Code Quality](#code-quality)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🔍 **Comprehensive Query Management**
- **List & Search**: Browse queries with pagination, filter by tags, search by keywords
- **CRUD Operations**: Create, read, update, and archive queries
- **Smart Tagging**: Organize queries with tags and retrieve tag statistics

### ⚡ **Query Execution**
- **Async Polling**: Execute long-running queries with automatic job polling
- **Parameterized Queries**: Pass dynamic parameters to queries
- **Cached Results**: Retrieve cached results without re-execution (configurable TTL)

### 📊 **Dashboard & Data Source Management**
- **Dashboard Access**: List and view Redash dashboards
- **Data Source Discovery**: Explore available data sources

### 🔗 **MCP Resources**
- **Resource URIs**: Access queries and dashboards as MCP resources (`redash://query/{id}`, `redash://dashboard/{id}`)
- **Rich Metadata**: Get query definitions and execution results in one call

### 🛡️ **Production-Ready**
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Error Handling**: Comprehensive error handling with detailed logging
- **Test Coverage**: 86%+ test coverage with 107 unit tests
- **Logging**: Configurable logging levels (DEBUG, INFO, WARNING, ERROR)

## Installation

### Quick Start (Claude MCP Add)

The easiest way to install is using the `claude mcp add` command:

```bash
claude mcp add redash \
  --env REDASH_URL=https://your-redash-instance.com \
  --env REDASH_API_KEY=your_api_key_here \
  -- npx -y redash-connector-mcp
```

**Replace the following:**
- `https://your-redash-instance.com` - Your Redash instance URL
- `your_api_key_here` - Your Redash API key (see [Getting Your Redash API Key](#getting-your-redash-api-key))

This command will:
1. Automatically install the latest version via npx (no global install needed)
2. Configure the MCP server with your credentials
3. Make it available in Claude Desktop/Code

After running this command, restart Claude Desktop/Code to activate the server.

### Manual Installation

#### 1. Install the Package

```bash
npm install -g redash-connector-mcp
```

#### 2. Configure MCP Settings

Add the following to your Claude MCP configuration file:

**macOS/Linux**: `~/.claude/config.json`
**Windows**: `%APPDATA%\Claude\config.json`

```json
{
  "mcpServers": {
    "redash": {
      "command": "redash-connector-mcp",
      "env": {
        "REDASH_URL": "https://your-redash-instance.com",
        "REDASH_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### 3. Restart Claude

Restart Claude Desktop or Claude Code to load the MCP server.

## Configuration

### Environment Variables

The MCP server requires the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDASH_URL` | **Yes** | - | Your Redash instance URL (e.g., `https://redash.example.com`) |
| `REDASH_API_KEY` | **Yes** | - | Your Redash user API key |
| `REDASH_TIMEOUT` | No | `30000` | HTTP request timeout in milliseconds |
| `REDASH_JOB_TIMEOUT` | No | `60000` | Query job polling timeout in milliseconds |
| `REDASH_JOB_POLL_INTERVAL` | No | `1000` | Job polling interval in milliseconds |
| `LOG_LEVEL` | No | `INFO` | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR` |

**When using `claude mcp add`**: Environment variables are passed directly via `--env` flags (no `.env` file needed).

**When running manually or in development**: You can create a `.env` file in your project directory:

```env
REDASH_URL=https://your-redash-instance.com
REDASH_API_KEY=your_api_key_here
REDASH_TIMEOUT=30000
LOG_LEVEL=INFO
```

### Getting Your Redash API Key

1. Log in to your Redash instance
2. Click your profile icon (top-right corner)
3. Navigate to **Settings** → **Account**
4. Find or generate your **API Key** under the "API Key" section
5. Copy the key and use it as `REDASH_API_KEY`

**Security Note**: Keep your API key confidential. Never commit it to version control.

## Usage

Once configured, interact with Redash through natural language conversations with Claude:

### Example Conversations

#### Query Management

```
You: "List all queries tagged with 'sales'"
Claude: [Uses list-queries tool with tag filter]

You: "Show me query ID 123"
Claude: [Uses get-query tool]

You: "Create a query named 'Daily Revenue' that selects from the sales table"
Claude: [Uses create-query tool]

You: "Update query 123 to include WHERE date > '2024-01-01'"
Claude: [Uses update-query tool]
```

#### Query Execution

```
You: "Execute query 430"
Claude: [Uses execute-query tool, polls async job if needed]

You: "Run query 430 with start_date='2024-01-01' and end_date='2024-12-31'"
Claude: [Uses execute-query tool with parameters]

You: "Get the cached results for query 430"
Claude: [Uses get-query-results tool]
```

#### Dashboards & Data Sources

```
You: "Show me all dashboards"
Claude: [Uses list-dashboards tool]

You: "What data sources are available?"
Claude: [Uses list-data-sources tool]

You: "Show me the details of dashboard 5"
Claude: [Uses get-dashboard tool]
```

#### Analytics & Insights

```
You: "What are the most commonly used query tags?"
Claude: [Uses list-query-tags tool]

You: "Find all queries about customer churn"
Claude: [Uses list-queries with search parameter]
```

## Available Tools

The MCP server provides 11 tools for interacting with Redash:

### Query Management (5 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-queries` | List queries with pagination, filtering, and search | `page`, `pageSize`, `tag`, `search` |
| `get-query` | Get detailed information about a query | `queryId` |
| `create-query` | Create a new query | `name`, `dataSourceId`, `query`, `description`, `tags`, `options`, `schedule` |
| `update-query` | Update an existing query | `queryId`, `name`, `query`, `description`, `tags`, `options`, `schedule` |
| `archive-query` | Archive (soft delete) a query | `queryId` |

### Query Execution (2 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `execute-query` | Execute a query and return results (async polling supported) | `queryId`, `parameters` |
| `get-query-results` | Get cached results without re-execution | `queryId`, `maxAge` (default: 86400s) |

### Dashboard Management (2 tools)

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-dashboards` | List dashboards with pagination | `page`, `pageSize` |
| `get-dashboard` | Get dashboard details and widgets | `dashboardId` |

### Data Source Management (1 tool)

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-data-sources` | List all available data sources | - |

### Tag Management (1 tool)

| Tool | Description | Parameters |
|------|-------------|------------|
| `list-query-tags` | List query tags with usage counts (sorted by frequency) | - |

## MCP Resources

The server exposes Redash queries and dashboards as MCP resources, enabling Claude to discover and read them:

### Resource URIs

- **Queries**: `redash://query/{queryId}`
- **Dashboards**: `redash://dashboard/{dashboardId}`

### Resource Discovery

Claude can automatically discover available queries and dashboards through the `listResources()` MCP endpoint.

### Reading Resources

When reading a query resource, the response includes:
- Query definition (name, SQL, description, tags, etc.)
- Latest execution results (if available)
- Metadata (creation date, author, etc.)

Example resource read:
```json
{
  "uri": "redash://query/123",
  "mimeType": "application/json",
  "contents": {
    "query": { "id": 123, "name": "Sales Report", "query": "SELECT ..." },
    "result": { "data": { "rows": [...], "columns": [...] } }
  }
}
```

## Development

### Prerequisites

- Node.js 18+ (recommended: Node.js 20 LTS)
- npm 9+
- A Redash instance (for testing)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/redash-connector-mcp.git
   cd redash-connector-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Redash credentials
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

### Testing

The project uses [Vitest](https://vitest.dev/) for testing with 86%+ coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

**Test Structure**:
- `tests/unit/` - Unit tests for core modules
- `tests/helpers/` - Test helpers and mocks
- `tests/fixtures/` - Test data fixtures

**Coverage Report**:
```
File             | Lines  | Funcs  | Branch | Stmts
-----------------|--------|--------|--------|--------
All files        | 86.33% | 93.33% | 73.42% | 83.94%
 index.ts        | 75%    | 83.33% | 55.38% | 73.41%
 logger.ts       | 100%   | 100%   | 100%   | 100%
 redashClient.ts | 99.11% | 100%   | 88.15% | 95.16%
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

**Pre-commit Hooks**: Husky + lint-staged automatically run linting and formatting on staged files.

### Local Development with Claude

To test your local build with Claude Desktop/Code:

```json
{
  "mcpServers": {
    "redash-dev": {
      "command": "node",
      "args": ["/absolute/path/to/redash-connector-mcp/dist/index.js"],
      "env": {
        "REDASH_URL": "https://your-redash-instance.com",
        "REDASH_API_KEY": "your_api_key_here",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

#### Error: "REDASH_URL and REDASH_API_KEY must be provided"

**Cause**: Environment variables are not configured correctly.

**Solution**:
1. Verify the MCP configuration file exists at `~/.claude/config.json` (macOS/Linux) or `%APPDATA%\Claude\config.json` (Windows)
2. Ensure `REDASH_URL` and `REDASH_API_KEY` are set in the `env` section
3. Restart Claude after making changes
4. Check the MCP server logs for detailed error messages

#### Error: "Query execution timed out"

**Cause**: Query is taking longer than the configured timeout.

**Solutions**:
1. Increase `REDASH_JOB_TIMEOUT` (default: 60000ms)
   ```json
   "env": {
     "REDASH_URL": "...",
     "REDASH_API_KEY": "...",
     "REDASH_JOB_TIMEOUT": "120000"
   }
   ```
2. Optimize the query in Redash's web interface
3. Check if the query executes successfully in Redash directly

#### Error: "Failed to fetch queries from Redash"

**Cause**: Connection or authentication issue.

**Solutions**:
1. Verify `REDASH_URL` is correct and accessible from your machine
2. Test the URL in a browser: `https://your-redash-instance.com/api/queries`
3. Verify `REDASH_API_KEY` is valid (regenerate if necessary)
4. Check network connectivity and firewall settings
5. Ensure your Redash instance is running

#### MCP Server Not Appearing in Claude

**Solutions**:
1. Restart Claude Desktop/Code completely (quit and reopen)
2. Check the MCP configuration file syntax (must be valid JSON)
3. Verify the `command` path is correct
4. Check Claude's MCP logs for error messages

### Debugging

Enable debug logging for detailed information:

```json
{
  "mcpServers": {
    "redash": {
      "command": "redash-connector-mcp",
      "env": {
        "REDASH_URL": "https://your-redash-instance.com",
        "REDASH_API_KEY": "your_api_key_here",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

Logs will appear in Claude's MCP server logs panel.

## Security

### Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables or secure secret management
   - Rotate API keys periodically
   - Use read-only API keys when possible

2. **Network Security**
   - Use HTTPS for Redash instance URLs
   - Consider IP whitelisting if your Redash instance supports it
   - Use VPN or private networks for sensitive data

3. **Access Control**
   - The MCP server inherits the permissions of the Redash API key
   - Use API keys with minimal necessary permissions
   - Avoid using admin API keys for routine operations

### Reporting Security Issues

If you discover a security vulnerability, please email [security@example.com](mailto:security@example.com) instead of using the issue tracker.

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass (`npm test`)
6. Ensure code quality checks pass (`npm run lint && npm run typecheck`)
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Guidelines

- **Code Style**: Follow the existing code style (enforced by ESLint + Prettier)
- **Tests**: Maintain or improve test coverage (currently 86%+)
- **Documentation**: Update README.md for new features
- **Commits**: Use clear, descriptive commit messages
- **Types**: Add proper TypeScript types for all new code

### Pull Request Process

1. Update the README.md with details of changes (if applicable)
2. Add tests for new functionality
3. Ensure the test suite passes
4. Update the version number following [SemVer](https://semver.org/)
5. The PR will be merged once approved by maintainers

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Roadmap

Future enhancements under consideration:

- [ ] Query result caching with configurable TTL
- [ ] Batch query execution
- [ ] Query scheduling management
- [ ] Alert configuration
- [ ] Visualization metadata extraction
- [ ] Query performance metrics
- [ ] Multi-instance support
- [ ] Webhook support for query completion

See [Issues](https://github.com/yourusername/redash-connector-mcp/issues) for active feature requests.

## Related Projects

- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - The MCP specification
- [Redash](https://github.com/getredash/redash) - Open source data visualization platform
- [Claude Desktop](https://claude.ai/desktop) - Desktop app for Claude AI
- [Claude Code](https://claude.ai/code) - VS Code extension for Claude AI

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/anthropics/model-context-protocol)
- Powered by [Redash API](https://redash.io/help/user-guide/integrations-and-api/api)
- TypeScript, Vitest, and the amazing open-source community

---

**Made with ❤️ for the Redash and Claude AI communities**

If you find this project useful, please consider giving it a ⭐ on GitHub!
