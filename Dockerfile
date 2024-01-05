FROM node:18

# App directory
ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

# Install
COPY package*.json ./
RUN npm install

# Copy
COPY . .

# Port for application
EXPOSE 3000

# Start of project
CMD ["npm", "start"]