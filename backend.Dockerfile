FROM --platform=linux/amd64 node:21-slim

# App directory
ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

# Install
COPY package*.json ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/backend/package.json ./packages/backend/

RUN npm install

# Copy
COPY . .

# Start of project
CMD ["npm", "run", "start:backend"]
