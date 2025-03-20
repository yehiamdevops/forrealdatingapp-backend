FROM node:23

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies using npm ci for a clean and consistent install
RUN npm ci --production

# Copy the rest of the application files
COPY app.js ./
COPY models ./models
COPY middlewares ./middlewares
COPY routes ./routes
COPY db ./db
COPY secret ./secret
COPY server.js ./

CMD [ "node", "app" ]