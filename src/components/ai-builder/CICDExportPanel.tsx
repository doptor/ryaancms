import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, Copy, CheckCircle2, Container,
  GitBranch, Cloud, FileCode2, Settings,
  Loader2, Package,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PipelineState } from "@/lib/engine/orchestrator";

interface CICDExportPanelProps {
  pipelineState: PipelineState | null;
}

type ExportType = "dockerfile" | "docker_compose" | "github_actions" | "env_template" | "nginx";

export function CICDExportPanel({ pipelineState }: CICDExportPanelProps) {
  const [activeExport, setActiveExport] = useState<ExportType>("dockerfile");
  const [copiedExport, setCopiedExport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const config = pipelineState?.config;
  const projectName = config?.title?.toLowerCase().replace(/\s+/g, "-") || "app";

  const generateDockerfile = (): string => {
    return `# ========================================
# ${config?.title || "App"} — Dockerfile
# Multi-stage build for production
# ========================================

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/package*.json ./

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]`;
  };

  const generateDockerCompose = (): string => {
    return `# ========================================
# ${config?.title || "App"} — Docker Compose
# ========================================
version: "3.9"

services:
  app:
    build: .
    container_name: ${projectName}
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://\${DB_USER}:\${DB_PASS}@db:3306/\${DB_NAME}
      - JWT_SECRET=\${JWT_SECRET}
      - PORT=3000
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  db:
    image: mysql:8.0
    container_name: ${projectName}-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASS}
      MYSQL_DATABASE: \${DB_NAME}
      MYSQL_USER: \${DB_USER}
      MYSQL_PASSWORD: \${DB_PASS}
    volumes:
      - db-data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: ${projectName}-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: ${projectName}-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  db-data:
  redis-data:

networks:
  app-network:
    driver: bridge`;
  };

  const generateGitHubActions = (): string => {
    return `# ========================================
# ${config?.title || "App"} — CI/CD Pipeline
# GitHub Actions Workflow
# ========================================
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  # ─── Lint & Type Check ───
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Lint frontend
        run: cd frontend && npm run lint

      - name: Type check backend
        run: cd backend && npx tsc --noEmit

  # ─── Test ───
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm

      - name: Install & test backend
        env:
          DATABASE_URL: mysql://root:testpass@localhost:3306/test_db
          JWT_SECRET: test-secret
        run: |
          cd backend && npm ci
          npx prisma migrate deploy
          npm test

      - name: Install & test frontend
        run: cd frontend && npm ci && npm test -- --passWithNoTests

  # ─── Build & Push Docker ───
  build:
    name: Build & Push
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
            \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}

  # ─── Deploy ───
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: \${{ secrets.DEPLOY_HOST }}
          username: \${{ secrets.DEPLOY_USER }}
          key: \${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/${projectName}
            docker compose pull
            docker compose up -d --remove-orphans
            docker system prune -f`;
  };

  const generateEnvTemplate = (): string => {
    const collections = config?.collections || [];
    return `# ========================================
# ${config?.title || "App"} — Environment Variables
# Copy to .env and fill in values
# ========================================

# ─── Server ───
NODE_ENV=development
PORT=3000

# ─── Database ───
DATABASE_URL=mysql://user:password@localhost:3306/${projectName}
DB_USER=user
DB_PASS=password
DB_NAME=${projectName}
DB_ROOT_PASS=rootpassword

# ─── Authentication ───
JWT_SECRET=change-me-to-a-random-string
JWT_EXPIRY=1d

# ─── Redis (optional) ───
REDIS_URL=redis://localhost:6379

# ─── Email (optional) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# ─── File Storage (optional) ───
STORAGE_PROVIDER=local
# S3_BUCKET=
# S3_REGION=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=

# ─── External APIs ───
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=

# ─── CORS ───
CORS_ORIGIN=http://localhost:5173

# ─── Collections: ${collections.map(c => c.name).join(", ")} ───
# All ${collections.length} tables will be created via Prisma migrations`;
  };

  const generateNginxConfig = (): string => {
    return `# ========================================
# ${config?.title || "App"} — Nginx Configuration
# Reverse proxy with SSL
# ========================================

events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    upstream app_backend {
        server app:3000;
    }

    server {
        listen 80;
        server_name ${projectName}.com www.${projectName}.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name ${projectName}.com www.${projectName}.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth routes (stricter rate limit)
        location /api/auth/ {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Static files
        location / {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            proxy_pass http://app_backend;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}`;
  };

  const exportGenerators: Record<ExportType, { label: string; filename: string; icon: any; generate: () => string }> = {
    dockerfile: { label: "Dockerfile", filename: "Dockerfile", icon: Container, generate: generateDockerfile },
    docker_compose: { label: "Docker Compose", filename: "docker-compose.yml", icon: Package, generate: generateDockerCompose },
    github_actions: { label: "GitHub Actions", filename: ".github/workflows/ci-cd.yml", icon: GitBranch, generate: generateGitHubActions },
    env_template: { label: ".env Template", filename: ".env.example", icon: Settings, generate: generateEnvTemplate },
    nginx: { label: "Nginx Config", filename: "nginx.conf", icon: Cloud, generate: generateNginxConfig },
  };

  const currentExport = exportGenerators[activeExport];
  const content = currentExport.generate();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopiedExport(activeExport);
    setTimeout(() => setCopiedExport(null), 2000);
    toast({ title: "Copied!", description: `${currentExport.label} copied to clipboard.` });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentExport.filename.split("/").pop() || currentExport.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `${currentExport.filename} saved.` });
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Download each file individually
      Object.entries(exportGenerators).forEach(([, exp]) => {
        const blob = new Blob([exp.generate()], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = exp.filename.split("/").pop() || exp.filename;
        a.click();
        URL.revokeObjectURL(url);
      });
      toast({ title: "All configs exported", description: "5 infrastructure files saved." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Container className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">CI/CD & Infrastructure</span>
          <Badge variant="secondary" className="text-[10px]">5 configs</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-7 text-xs">
            {copiedExport === activeExport ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1 h-7 text-xs">
            <Download className="w-3 h-3" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll} disabled={isExporting} className="gap-1 h-7 text-xs">
            {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            Export All
          </Button>
        </div>
      </div>

      {/* Export tabs */}
      <div className="px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <Tabs value={activeExport} onValueChange={(v) => setActiveExport(v as ExportType)}>
          <TabsList className="bg-transparent h-8 p-0 gap-1">
            {Object.entries(exportGenerators).map(([key, exp]) => {
              const Icon = exp.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-2.5 py-1 text-[11px] gap-1"
                >
                  <Icon className="w-3 h-3" />
                  {exp.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Info bar */}
      <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <FileCode2 className="w-3 h-3" />
          <span className="font-mono">{currentExport.filename}</span>
          <span>•</span>
          <span>{content.split("\n").length} lines</span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </pre>
      </ScrollArea>
    </div>
  );
}
