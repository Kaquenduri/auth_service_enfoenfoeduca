FROM node:22

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["pnpm", "start"]