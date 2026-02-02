# PocketBase Auth Layer

A versatile authentication layer that protects applications with PocketBase OAuth authentication. Supports three modes:
- **Static Mode**: Protect static websites
- **ForwardAuth Mode**: Traefik-compatible authentication middleware
- **Proxy Mode**: Reverse proxy for dynamic applications

## ✨ Features

- **OAuth Authentication**: Login with GitHub, Google, or Microsoft
- **Group-based Access Control**: Users must be members of a specific group to access content
- **Multiple Auth Modes**: Static site, ForwardAuth (Traefik), or Reverse Proxy
- **Responsive Login UI**: Mobile-friendly login interface with FAQ
- **Cookie-based Sessions**: Secure session management
- **WebSocket Support**: Full WebSocket proxying in proxy mode
- **Open Redirect Protection**: Validates redirect URLs against whitelist

## 🚀 Quick Start

### Using as Base Image

The recommended approach is to extend this image and add your static website:

```dockerfile
FROM your-registry/pocketbase-auth-layer:latest

# Copy your static website to the build directory
COPY ./dist /app/build

# Optional: Override views if needed
# COPY ./custom-views /app/views
```

### Multi-stage Build Example

For building and protecting a static site in one Dockerfile:

```dockerfile
# Build stage
FROM node:alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Protection stage
FROM your-registry/pocketbase-auth-layer:latest
COPY --from=builder /app/dist /app/build
```

### Docker Compose

```yaml
version: '3.8'
services:
  protected-site:
    build: .
    ports:
      - "8000:8000"
    environment:
      - POCKETBASE_URL=https://your-pocketbase.example.com
      - POCKETBASE_GROUP=members
      - POCKETBASE_URL_MICROSOFT=https://your-pocketbase-microsoft.example.com
      - PORT=8000
```

## 📁 Directory Structure

```
/app/
├── build/           # Your static website files go here
│   ├── index.html
│   ├── assets/
│   └── public/      # Public assets (CSS, JS, images)
├── views/           # EJS templates for auth pages
│   ├── login.ejs
│   └── not_a_member.ejs
├── app.ts           # Application entry point
├── index.ts         # Express app factory
└── package.json
```

## 🔧 Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `POCKETBASE_URL` | ✅ | URL of your PocketBase instance | - |
| `POCKETBASE_GROUP` | ✅ | Group field name that users must have | - |
| `AUTH_MODE` | ❌ | Auth mode: `static`, `forwardauth`, or `proxy` | `static` |
| `UPSTREAM_URL` | If proxy | URL to proxy requests to (e.g., `http://fava:5000`) | - |
| `ALLOWED_REDIRECT_DOMAINS` | If forwardauth | Comma-separated allowed redirect domains | - |
| `PUBLIC_URL` | ❌ | Public URL of this auth service | - |
| `POCKETBASE_URL_MICROSOFT` | ❌ | Separate PocketBase URL for Microsoft OAuth | `POCKETBASE_URL` |
| `PORT` | ❌ | Port the server runs on | `3000` |

### Environment Variable Examples

```bash
# Static mode (default) - protect static files
POCKETBASE_URL=https://pb.example.com
POCKETBASE_GROUP=premium_members

# ForwardAuth mode - Traefik integration
POCKETBASE_URL=https://pb.example.com
POCKETBASE_GROUP=fava_users
AUTH_MODE=forwardauth
ALLOWED_REDIRECT_DOMAINS=fava.example.com,grafana.example.com
PUBLIC_URL=https://auth.example.com

# Proxy mode - reverse proxy to upstream service
POCKETBASE_URL=https://pb.example.com
POCKETBASE_GROUP=fava_users
AUTH_MODE=proxy
UPSTREAM_URL=http://fava:5000

# Custom port
PORT=8080
```

## 🔄 Auth Modes

### Static Mode (Default)

Serves static files after authentication. Use this to protect static websites.

```yaml
services:
  protected-site:
    image: ghcr.io/levino/pocketbase-auth:latest
    environment:
      - POCKETBASE_URL=https://pb.example.com
      - POCKETBASE_GROUP=members
    volumes:
      - ./dist:/app/build:ro
```

### ForwardAuth Mode

Traefik-compatible authentication endpoint. Returns 200/401/403 based on auth status.

**Endpoint:** `GET /auth/verify`

| Status | Meaning | Response Headers |
|--------|---------|------------------|
| 200 | Authenticated and authorized | `X-Auth-User`, `X-Auth-Email`, `X-Auth-Groups` |
| 401 | Not authenticated | - |
| 403 | Authenticated but not in group | - |

**Traefik Docker Compose Example:**

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  pocketbase-auth:
    image: ghcr.io/levino/pocketbase-auth:latest
    environment:
      - POCKETBASE_URL=https://pb.example.com
      - POCKETBASE_GROUP=fava_users
      - AUTH_MODE=forwardauth
      - ALLOWED_REDIRECT_DOMAINS=fava.example.com
      - PUBLIC_URL=https://auth.example.com
    labels:
      - "traefik.enable=true"
      # Auth service routes
      - "traefik.http.routers.auth.rule=Host(`auth.example.com`)"
      - "traefik.http.services.auth.loadbalancer.server.port=3000"
      # ForwardAuth middleware
      - "traefik.http.middlewares.pocketbase-auth.forwardauth.address=http://pocketbase-auth:3000/auth/verify"
      - "traefik.http.middlewares.pocketbase-auth.forwardauth.authResponseHeaders=X-Auth-User,X-Auth-Email,X-Auth-Groups"

  fava:
    image: yegle/fava
    command: fava --read-only /data/main.beancount
    volumes:
      - ./ledger:/data:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fava.rule=Host(`fava.example.com`)"
      - "traefik.http.routers.fava.middlewares=pocketbase-auth@docker"
      - "traefik.http.services.fava.loadbalancer.server.port=5000"
```

### Proxy Mode

Acts as a reverse proxy, authenticating requests before forwarding to upstream service. Simplest setup for protecting dynamic applications.

**Features:**
- Automatic header injection: `X-Auth-User`, `X-Auth-Email`, `X-Auth-Groups`
- WebSocket support for real-time applications
- No Traefik configuration needed

```yaml
version: '3.8'

services:
  pocketbase-auth:
    image: ghcr.io/levino/pocketbase-auth:latest
    environment:
      - POCKETBASE_URL=https://pb.example.com
      - POCKETBASE_GROUP=fava_users
      - AUTH_MODE=proxy
      - UPSTREAM_URL=http://fava:5000
    ports:
      - "8000:3000"

  fava:
    image: yegle/fava
    command: fava --read-only /data/main.beancount
    volumes:
      - ./ledger:/data:ro
    # No ports exposed - only accessible via pocketbase-auth
```

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Protected content (static files or proxy) |
| `/login` | GET | Login page (accepts `?rd=` redirect parameter) |
| `/auth/verify` | GET | ForwardAuth endpoint (returns 200/401/403) |
| `/api/cookie` | POST | OAuth token to cookie conversion |
| `/api/logout` | POST | Clear auth cookie and redirect |

### Login with Redirect

The `/login` endpoint accepts a `rd` query parameter for post-login redirects:

```
/login?rd=https://fava.example.com/income_statement/
```

The redirect URL is validated against `ALLOWED_REDIRECT_DOMAINS` to prevent open redirect vulnerabilities.

## 🔒 How Authentication Works

1. **Unauthenticated Request**: User visits protected site → Redirected to login page
2. **OAuth Login**: User clicks provider button → OAuth flow via PocketBase
3. **Token Exchange**: OAuth token received → Converted to secure cookie
4. **Group Check**: User authenticated → Check if user belongs to required group
5. **Access Granted**: Group member → Serve static content
6. **Access Denied**: Not a group member → Show "not a member" page

## 🏗️ PocketBase Setup

Your PocketBase instance needs:

### Collections

1. **users** collection with OAuth providers configured
2. **groups** collection with fields:
   - `user_id` (relation to users)
   - `[YOUR_GROUP_NAME]` (boolean field matching `POCKETBASE_GROUP`)

### OAuth Configuration

Configure OAuth providers in PocketBase admin:
- GitHub OAuth App
- Google OAuth App
- Microsoft OAuth App (optional)

### Example Group Record

```json
{
  "user_id": "user123",
  "premium_members": true,
  "subscribers": false
}
```

## 🎨 Customization

### Custom Login Page

Replace the login view with your own branding:

```dockerfile
FROM your-registry/pocketbase-auth-layer:latest
COPY ./custom-views/login.ejs /app/views/login.ejs
COPY ./static-site /app/build
```

### Custom Styling

Add your CSS to the `/app/build/public/` directory:

```dockerfile
FROM your-registry/pocketbase-auth-layer:latest
COPY ./dist /app/build
COPY ./custom.css /app/build/public/custom.css
```

### Environment-specific Configuration

```dockerfile
FROM your-registry/pocketbase-auth-layer:latest
COPY ./dist /app/build

# Development
# ENV POCKETBASE_URL=http://localhost:8090

# Production
ENV POCKETBASE_URL=https://prod-pb.example.com
ENV POCKETBASE_GROUP=verified_users
```

## 🚢 Deployment

### Build and Run

```bash
# Build your protected site
docker build -t my-protected-site .

# Run with environment variables
docker run -p 8000:8000 \
  -e POCKETBASE_URL=https://pb.example.com \
  -e POCKETBASE_GROUP=members \
  my-protected-site
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - POCKETBASE_URL=${POCKETBASE_URL}
      - POCKETBASE_GROUP=${POCKETBASE_GROUP}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🛠️ Development

### Local Development

```bash
# Clone and install
git clone <repo>
cd pocketbase-auth-layer
npm install

# Set environment variables
export POCKETBASE_URL=http://localhost:8090
export POCKETBASE_GROUP=members

# Run
npm run dev
```

### Adding Your Static Site

1. Build your static site (React, Vue, vanilla HTML, etc.)
2. Copy the build output to `/app/build` in the container
3. Ensure public assets are in `/app/build/public/`

## 🔍 Troubleshooting

### Common Issues

**Authentication Loop**: Check that `POCKETBASE_URL` is accessible and OAuth is configured

**Group Access Denied**: Verify the user has the correct group field set to `true`

**Assets Not Loading**: Ensure public assets are in `/app/build/public/` directory

**CORS Issues**: Configure PocketBase CORS settings for your domain

### Debug Mode

Add debug logging:

```dockerfile
FROM your-registry/pocketbase-auth-layer:latest
ENV NODE_ENV=development
COPY ./dist /app/build
```

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]