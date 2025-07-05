This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

ローカル開発環境のセットアップ

前提条件
Git

Node.js (v18.17.0 以上推奨)

Docker Desktop

起動手順

1.リポジトリのクローン
    git clone https://github.com/tuko-na/product-lifecycle-app.git
    cd product-lifecycle-app

2.
    npm i

3.環境変数ファイル（.env）の作成
プロジェクトのルートに .env ファイルを作成し、下記の「環境変数について」を参考に必要な値を設定してください。
# Prismaが使用するデータベース接続URL
# docker-compose.ymlで設定した値に合わせます
    DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/product_lifecycle_app"

# NextAuth.jsが使用するシークレットキー
# ターミナルで `openssl rand -base64 32` を実行して生成した値を設定
    NEXTAUTH_SECRET=

# NextAuth.jsが使用するベースURL
    NEXTAUTH_URL=http://localhost:3000

# GitHub OAuth アプリのクレデンシャル
# 自身でGitHub上でOAuth Appを作成し、取得した値を設定
    GITHUB_ID=
    GITHUB_SECRET=

4.Dockerコンテナの起動
PostgreSQLデータベースをDockerコンテナとして起動します。
    docker-compose up -d

5.データベースマイグレーションの実行
アプリケーションが必要とするテーブルをデータベース内に作成します。
    npx prisma migrate dev

    nom run dev
