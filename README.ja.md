# redash-connector-mcp

[![npm version](https://badge.fury.io/js/redash-connector-mcp.svg)](https://www.npmjs.com/package/redash-connector-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-86%25-green.svg)](./coverage)

[Redash](https://redash.io/) と Claude AI (Desktop & Code) をシームレスに連携する Model Context Protocol (MCP) サーバーです。Claude との自然言語対話を通じて、データウェアハウスへのクエリ、クエリ管理、分析ワークフローの実行が可能です。

> [English version](./README.md)

## 目次

- [機能](#機能)
- [インストール](#インストール)
  - [クイックスタート (Claude MCP Add)](#クイックスタート-claude-mcp-add)
  - [手動インストール](#手動インストール)
- [設定](#設定)
  - [環境変数](#環境変数)
  - [Redash API キーの取得方法](#redash-api-キーの取得方法)
- [使い方](#使い方)
  - [会話例](#会話例)
- [利用可能なツール](#利用可能なツール)
- [MCP リソース](#mcp-リソース)
- [開発](#開発)
  - [前提条件](#前提条件)
  - [セットアップ](#セットアップ)
  - [テスト](#テスト)
  - [コード品質](#コード品質)
- [トラブルシューティング](#トラブルシューティング)
- [セキュリティ](#セキュリティ)
- [コントリビュート](#コントリビュート)
- [ライセンス](#ライセンス)

## 機能

### 包括的なクエリ管理
- **一覧・検索**: ページネーション付きのクエリ一覧、タグフィルタ、キーワード検索
- **CRUD操作**: クエリの作成・参照・更新・アーカイブ
- **タグ管理**: タグによるクエリ整理とタグ統計の取得

### クエリ実行
- **非同期ポーリング**: 長時間クエリの自動ジョブポーリング
- **パラメータ付きクエリ**: 動的パラメータの受け渡し
- **キャッシュ結果**: 再実行なしでキャッシュ済み結果を取得（TTL設定可能）

### ダッシュボード・データソース管理
- **ダッシュボードアクセス**: ダッシュボードの一覧・詳細表示
- **データソース探索**: 利用可能なデータソースの確認

### MCP リソース
- **リソースURI**: クエリとダッシュボードを MCP リソースとしてアクセス (`redash://query/{id}`, `redash://dashboard/{id}`)
- **リッチメタデータ**: クエリ定義と実行結果を一括取得

### プロダクション対応
- **型安全**: 厳密な型チェック付きの完全な TypeScript 実装
- **エラーハンドリング**: 詳細なログ出力付きの包括的なエラー処理
- **テストカバレッジ**: 107のユニットテストで86%以上のカバレッジ
- **ログ**: 設定可能なログレベル (DEBUG, INFO, WARNING, ERROR)

## インストール

### クイックスタート (Claude MCP Add)

`claude mcp add` コマンドで簡単にインストールできます:

```bash
claude mcp add redash \
  --env REDASH_URL=https://your-redash-instance.com \
  --env REDASH_API_KEY=your_api_key_here \
  -- npx -y redash-connector-mcp
```

**以下を置き換えてください:**
- `https://your-redash-instance.com` - Redash インスタンスの URL
- `your_api_key_here` - Redash API キー ([Redash API キーの取得方法](#redash-api-キーの取得方法)を参照)

このコマンドの動作:
1. npx で最新版を自動インストール（グローバルインストール不要）
2. 認証情報を含む MCP サーバー設定を構成
3. Claude Desktop/Code で利用可能に

コマンド実行後、Claude Desktop/Code を再起動してサーバーを有効化してください。

### 手動インストール

#### 1. パッケージのインストール

```bash
npm install -g redash-connector-mcp
```

#### 2. MCP 設定の構成

Claude MCP 設定ファイルに以下を追加してください:

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

#### 3. Claude の再起動

Claude Desktop または Claude Code を再起動して MCP サーバーを読み込みます。

## 設定

### 環境変数

MCP サーバーには以下の環境変数が必要です:

| 変数 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| `REDASH_URL` | **Yes** | - | Redash インスタンスの URL (例: `https://redash.example.com`) |
| `REDASH_API_KEY` | **Yes** | - | Redash ユーザー API キー |
| `REDASH_TIMEOUT` | No | `30000` | HTTP リクエストタイムアウト (ミリ秒) |
| `REDASH_JOB_TIMEOUT` | No | `60000` | クエリジョブポーリングタイムアウト (ミリ秒) |
| `REDASH_JOB_POLL_INTERVAL` | No | `1000` | ジョブポーリング間隔 (ミリ秒) |
| `LOG_LEVEL` | No | `INFO` | ログレベル: `DEBUG`, `INFO`, `WARNING`, `ERROR` |

**環境変数は以下の3つの方法で設定できます:**

#### 1. `.env` ファイル（チームプロジェクト推奨）

プロジェクトルート（`.mcp.json` と同じディレクトリ）に `.env` ファイルを作成します:

```env
REDASH_URL=https://your-redash-instance.com
REDASH_API_KEY=your_api_key_here
REDASH_TIMEOUT=30000
LOG_LEVEL=INFO
```

`.mcp.json` では `${VAR}` 構文で参照します:

```json
{
  "mcpServers": {
    "redash": {
      "command": "npx",
      "args": ["redash-connector-mcp"],
      "env": {
        "REDASH_URL": "${REDASH_URL}",
        "REDASH_API_KEY": "${REDASH_API_KEY}"
      }
    }
  }
}
```

この方法により、`.mcp.json` にシークレットを含めずに git にコミットでき、`.env` は `.gitignore` に追加して管理します。CLI エントリーポイントは `dotenv` の `override: true` を使用するため、`.env` の値が常に優先されます。

#### 2. `claude mcp add` コマンド

`--env` フラグで環境変数を直接渡します（`.env` ファイル不要）。

#### 3. MCP 設定に直接記載

MCP 設定の `env` フィールドに値を直接設定します（共有リポジトリでは非推奨）。

### Redash API キーの取得方法

1. Redash インスタンスにログイン
2. プロフィールアイコン（右上）をクリック
3. **Settings** > **Account** に移動
4. 「API Key」セクションで API キーを確認または生成
5. キーをコピーして `REDASH_API_KEY` として使用

**セキュリティに関する注意**: API キーは機密情報です。バージョン管理にコミットしないでください。

## 使い方

設定完了後、Claude との自然言語対話で Redash を操作できます:

### 会話例

#### クエリ管理

```
You: 「salesタグが付いたクエリを一覧表示して」
Claude: [list-queries ツールをタグフィルタ付きで使用]

You: 「クエリID 123を表示して」
Claude: [get-query ツールを使用]

You: 「salesテーブルからSELECTする'日次売上'クエリを作成して」
Claude: [create-query ツールを使用]

You: 「クエリ123に WHERE date > '2024-01-01' を追加して」
Claude: [update-query ツールを使用]
```

#### クエリ実行

```
You: 「クエリ430を実行して」
Claude: [execute-query ツールを使用、必要に応じて非同期ジョブをポーリング]

You: 「クエリ430を start_date='2024-01-01'、end_date='2024-12-31' で実行して」
Claude: [execute-query ツールをパラメータ付きで使用]

You: 「クエリ430のキャッシュ結果を取得して」
Claude: [get-query-results ツールを使用]
```

#### ダッシュボード・データソース

```
You: 「全ダッシュボードを表示して」
Claude: [list-dashboards ツールを使用]

You: 「利用可能なデータソースは？」
Claude: [list-data-sources ツールを使用]

You: 「ダッシュボード5の詳細を表示して」
Claude: [get-dashboard ツールを使用]
```

#### 分析・インサイト

```
You: 「最もよく使われるクエリタグは？」
Claude: [list-query-tags ツールを使用]

You: 「顧客チャーンに関するクエリを検索して」
Claude: [list-queries を検索パラメータ付きで使用]
```

## 利用可能なツール

MCP サーバーは Redash と連携するための11のツールを提供します:

### クエリ管理 (5ツール)

| ツール | 説明 | パラメータ |
|--------|------|-----------|
| `list-queries` | ページネーション、フィルタ、検索付きでクエリを一覧表示 | `page`, `pageSize`, `tag`, `search` |
| `get-query` | クエリの詳細情報を取得 | `queryId` |
| `create-query` | 新規クエリを作成 | `name`, `dataSourceId`, `query`, `description`, `tags`, `options`, `schedule` |
| `update-query` | 既存クエリを更新 | `queryId`, `name`, `query`, `description`, `tags`, `options`, `schedule` |
| `archive-query` | クエリをアーカイブ（論理削除） | `queryId` |

### クエリ実行 (2ツール)

| ツール | 説明 | パラメータ |
|--------|------|-----------|
| `execute-query` | クエリを実行して結果を返す（非同期ポーリング対応） | `queryId`, `parameters` |
| `get-query-results` | 再実行なしでキャッシュ済み結果を取得 | `queryId`, `maxAge` (デフォルト: 86400秒) |

### ダッシュボード管理 (2ツール)

| ツール | 説明 | パラメータ |
|--------|------|-----------|
| `list-dashboards` | ページネーション付きでダッシュボードを一覧表示 | `page`, `pageSize` |
| `get-dashboard` | ダッシュボードの詳細とウィジェットを取得 | `dashboardId` |

### データソース管理 (1ツール)

| ツール | 説明 | パラメータ |
|--------|------|-----------|
| `list-data-sources` | 利用可能な全データソースを一覧表示 | - |

### タグ管理 (1ツール)

| ツール | 説明 | パラメータ |
|--------|------|-----------|
| `list-query-tags` | 使用回数順にクエリタグを一覧表示 | - |

## MCP リソース

サーバーは Redash のクエリとダッシュボードを MCP リソースとして公開し、Claude が検出・参照できるようにします:

### リソース URI

- **クエリ**: `redash://query/{queryId}`
- **ダッシュボード**: `redash://dashboard/{dashboardId}`

### リソース検出

Claude は `listResources()` MCP エンドポイントを通じて、利用可能なクエリとダッシュボードを自動的に検出できます。

### リソースの参照

クエリリソースを参照すると、レスポンスには以下が含まれます:
- クエリ定義（名前、SQL、説明、タグなど）
- 最新の実行結果（利用可能な場合）
- メタデータ（作成日、作成者など）

リソース参照の例:
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

## 開発

### 前提条件

- Node.js 18+ (推奨: Node.js 20 LTS)
- npm 9+
- Redash インスタンス（テスト用）

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/yourusername/redash-connector-mcp.git
   cd redash-connector-mcp
   ```

2. **依存パッケージのインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .env を Redash の認証情報で編集
   ```

4. **プロジェクトのビルド**
   ```bash
   npm run build
   ```

### テスト

[Vitest](https://vitest.dev/) を使用し、86%以上のカバレッジでテストしています:

```bash
# 全テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage

# ウォッチモード
npm run test:watch

# UI モード
npm run test:ui
```

**テスト構成**:
- `tests/unit/` - コアモジュールのユニットテスト
- `tests/helpers/` - テストヘルパーとモック
- `tests/fixtures/` - テストデータフィクスチャ

### コード品質

```bash
# 型チェック
npm run typecheck

# リント
npm run lint

# リント自動修正
npm run lint:fix

# コードフォーマット
npm run format
```

**Pre-commit Hooks**: Husky + lint-staged によりステージされたファイルのリントとフォーマットを自動実行します。

### ローカル開発での Claude 連携

ローカルビルドを Claude Desktop/Code でテストする場合:

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

## トラブルシューティング

### よくある問題

#### エラー: "Missing required environment variables: REDASH_URL, REDASH_API_KEY"

**原因**: 環境変数が正しく設定されていません。

**解決方法**:
1. `.env` ファイルを使用している場合: プロジェクトルート（`.mcp.json` と同じディレクトリ）に `.env` ファイルが存在し、`REDASH_URL` と `REDASH_API_KEY` が記載されていることを確認
2. MCP 設定を使用している場合: `env` セクションに `REDASH_URL` と `REDASH_API_KEY` が設定されていることを確認
3. 変更後に Claude を再起動
4. MCP サーバーログで詳細なエラーメッセージを確認

#### エラー: "Query execution timed out"

**原因**: クエリの実行時間が設定されたタイムアウトを超えています。

**解決方法**:
1. `REDASH_JOB_TIMEOUT` を増加（デフォルト: 60000ms）
   ```json
   "env": {
     "REDASH_URL": "...",
     "REDASH_API_KEY": "...",
     "REDASH_JOB_TIMEOUT": "120000"
   }
   ```
2. Redash の Web インターフェースでクエリを最適化
3. Redash で直接クエリが正常に実行されるか確認

#### エラー: "Failed to fetch queries from Redash"

**原因**: 接続または認証の問題。

**解決方法**:
1. `REDASH_URL` が正しく、マシンからアクセス可能であることを確認
2. ブラウザで URL をテスト: `https://your-redash-instance.com/api/queries`
3. `REDASH_API_KEY` が有効であることを確認（必要に応じて再生成）
4. ネットワーク接続とファイアウォール設定を確認
5. Redash インスタンスが稼働中であることを確認

#### Claude に MCP サーバーが表示されない

**解決方法**:
1. Claude Desktop/Code を完全に再起動（終了して再度起動）
2. MCP 設定ファイルの構文を確認（有効な JSON であること）
3. `command` パスが正しいことを確認
4. Claude の MCP ログでエラーメッセージを確認

### デバッグ

詳細なログを有効にするには:

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

ログは Claude の MCP サーバーログパネルに表示されます。

## セキュリティ

### ベストプラクティス

1. **API キーのセキュリティ**
   - API キーをバージョン管理にコミットしない
   - 環境変数またはセキュアなシークレット管理を使用
   - API キーを定期的にローテーション
   - 可能な場合は読み取り専用の API キーを使用

2. **ネットワークセキュリティ**
   - Redash インスタンスの URL に HTTPS を使用
   - Redash インスタンスが対応している場合は IP ホワイトリストを検討
   - 機密データには VPN またはプライベートネットワークを使用

3. **アクセス制御**
   - MCP サーバーは Redash API キーの権限を継承
   - 必要最小限の権限を持つ API キーを使用
   - ルーティン操作に管理者 API キーを使用しない

## コントリビュート

コントリビュートを歓迎します！

### はじめに

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更を実装
4. テストを作成または更新
5. 全テストがパスすることを確認 (`npm test`)
6. コード品質チェックがパスすることを確認 (`npm run lint && npm run typecheck`)
7. 変更をコミット (`git commit -m 'Add amazing feature'`)
8. ブランチにプッシュ (`git push origin feature/amazing-feature`)
9. Pull Request を作成

### 開発ガイドライン

- **コードスタイル**: 既存のコードスタイルに従う（ESLint + Prettier で強制）
- **テスト**: テストカバレッジを維持または改善（現在86%以上）
- **ドキュメント**: 新機能の場合は README.md を更新
- **コミット**: 明確で説明的なコミットメッセージを使用
- **型**: 全ての新コードに適切な TypeScript 型を追加

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。
