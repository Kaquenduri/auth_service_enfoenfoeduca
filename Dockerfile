FROM node:22

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --ignore-scripts=false

COPY . .

RUN pnpm prisma generate

EXPOSE 3000

CMD ["pnpm", "start"]

