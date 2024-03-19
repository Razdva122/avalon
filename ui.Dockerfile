FROM --platform=linux/amd64 node:21-slim as build-stage
ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
COPY package*.json ./
RUN npm install
RUN npx puppeteer browsers install chrome
COPY . .
RUN npm run build:ui

FROM --platform=linux/amd64 nginx as production-stage
RUN mkdir /app
COPY --from=build-stage /app/packages/ui/dist /app
COPY nginx.conf /etc/nginx/nginx.conf