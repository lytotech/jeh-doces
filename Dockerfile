FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# Install workspace dependencies before copying source files so Docker can
# reuse this layer when only application code changes.
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

COPY packages ./packages
COPY apps ./apps
COPY eslint.config.js .prettierrc.json ./

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npm", "start"]
