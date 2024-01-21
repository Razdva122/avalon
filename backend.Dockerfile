FROM --platform=linux/amd64 node:21-slim

# App directory
ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

# Install
COPY package*.json ./
RUN npm install

# Copy
COPY . .

# Start of project
CMD ["npm", "run", "start:backend"]
