# Stage 1: Build Frontend
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=https://gomech-backend-7217905842.us-central1.run.app/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
# The unprivileged image runs nginx as a non-root user (uid 101); nginx.conf already listens on 8080,
# the container port Cloud Run uses in Terraform, so no privileged port is needed.
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
