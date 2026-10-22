# Der Auth-Layer (Express, Stand v1.0.11) als Basis-Image für die
# login-geschützten Docusaurus-Seiten: buergerstiftung-docs (k3s, Seite per
# Volume nach /app/build), drk-roessing/docs und kultueroeffner-roessing/docs
# (per FROM). Gebaut von .github/workflows/auth-layer-image.yml.
#
# Node per Digest gepinnt: Renovate sieht so jeden Rebuild von node:24-alpine
# (z. B. ein Node-Sicherheitsrelease), der Merge baut das Image neu.
FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy application files
COPY . .

# Build static assets
RUN npm run build-assets

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Start the Node.js application
CMD ["npm", "start"]
