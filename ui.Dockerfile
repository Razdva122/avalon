FROM --platform=linux/amd64 ghcr.io/puppeteer/puppeteer:latest as build-stage

ARG APP_DIR=/home/pptruser/app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

RUN chown pptruser:pptruser ${APP_DIR}

COPY --chown=pptruser:pptruser package*.json ${APP_DIR}/
USER pptruser
RUN npm install

COPY --chown=pptruser:pptruser . .
RUN npm run build:ui

FROM --platform=linux/amd64 nginx as production-stage
RUN mkdir /app
COPY --from=build-stage /home/pptruser/app/packages/ui/dist /app
COPY nginx.conf /etc/nginx/nginx.conf
