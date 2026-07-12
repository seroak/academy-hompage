FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package.json package-lock.json ./
# prisma는 optional이 아닌 일반 의존성으로 Prisma Studio 번들(effect, react-dom, chart.js 등, 약 200MB)을
# 끌고 온다 --omit=dev로도 못 뺀다 migrate deploy/db seed에 필요한 최소 설치이며, 이 레이어(~600MB)는
# package.json/package-lock.json이 그대로면 다이제스트가 고정되어 배포마다 재다운로드되지 않는다.
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN mkdir -p uploads

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
