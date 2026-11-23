# Der Auth-Layer (Express, Stand v1.0.11) als Basis-Image für die
# login-geschützten Docusaurus-Seiten: buergerstiftung-docs (k3s, Seite per
# Volume nach /app/build), drk-roessing/docs und kultueroeffner-roessing/docs
# (per FROM). Gebaut von .github/workflows/auth-layer-image.yml.
#
# Node per Digest gepinnt: Renovate sieht so jeden Rebuild von node:24-alpine
# (z. B. ein Node-Sicherheitsrelease), der Merge baut das Image neu.
FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

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
