FROM node:24.22.3-bookworm@sha256:4140e303c3dcf97edde1e42837bcb8db8c5d349d20582990d9b3ee99ee71481e AS build
WORKDIR /workspace
COPY . .
RUN npm ci --no-audit --no-fund
ARG NX_DAEMON=false
RUN env -u DEBUG npm run build

FROM node:24.22.3-bookworm@sha256:4140e303c3dcf97edde1e42837bcb8db8c5d349d20582990d9b3ee99ee71481e AS web
WORKDIR /app
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3000
COPY --from=build --chown=node:node /workspace/apps/web/.output/ ./
USER node
CMD ["node", "server/index.mjs"]

FROM node:24.22.3-bookworm@sha256:4140e303c3dcf97edde1e42837bcb8db8c5d349d20582990d9b3ee99ee71481e AS admin
ENV NODE_ENV=production NITRO_HOST=0.0.0.0 NITRO_PORT=3001
COPY --from=build --chown=node:node /workspace/apps/admin/.output/ /admin/
WORKDIR /admin
USER node
CMD ["node", "server/index.mjs"]

FROM build AS cms
ENV NODE_ENV=production
USER node
CMD ["npm", "run", "start", "-w", "@a/cms"]
