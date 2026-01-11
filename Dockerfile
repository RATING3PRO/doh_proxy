# 使用官方 Node.js 镜像作为基础
FROM node:20-alpine AS base

# 1. 依赖安装阶段
FROM base AS deps
# 添加 libc6-compat 以支持某些原生依赖
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./
# 安装依赖
RUN npm ci

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED 1

# 构建应用
RUN npm run build

# 3. 生产运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 自动利用 standalone 输出以减小镜像体积
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# 暴露端口（默认 8367）
ENV PORT 8367
EXPOSE 8367

# 启动命令
CMD ["node", "server.js"]
