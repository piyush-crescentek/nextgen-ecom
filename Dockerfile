# ---------- BUILDER ----------
FROM node:20.19.5-alpine3.22 AS builder

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

RUN rm -rf .next
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NODE_ENV
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN npm run build

# ---------- RUNNER ----------
FROM node:20.19.5-alpine3.22

WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static

RUN chown -R node:node /usr/src/app
USER node

EXPOSE 3000
CMD ["node", "server.js"]
