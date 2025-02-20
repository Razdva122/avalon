FROM --platform=${BUILDPLATFORM} ghcr.io/puppeteer/puppeteer:22.5.0 AS build-stage

ARG APP_DIR=/home/pptruser/app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

RUN chown pptruser:pptruser ${APP_DIR}

COPY --chown=pptruser:pptruser package*.json ${APP_DIR}/
COPY --chown=pptruser:pptruser packages/ui/package.json ${APP_DIR}/packages/ui/
COPY --chown=pptruser:pptruser packages/types/package.json ${APP_DIR}/packages/types/
COPY --chown=pptruser:pptruser packages/backend/package.json ${APP_DIR}/packages/backend/

USER pptruser
RUN npm install

COPY --chown=pptruser:pptruser . .
RUN npm run build:ui

FROM --platform=${BUILDPLATFORM} nginx AS production-stage
RUN mkdir /app
COPY --from=build-stage /home/pptruser/app/packages/ui/dist /app
COPY nginx.conf /etc/nginx/nginx.conf
