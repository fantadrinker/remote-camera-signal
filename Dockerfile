FROM node:20

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source

COPY . .

ENV PORT=3000

ENV SSL_PATH=/etc/ssl/certs

EXPOSE 3000

RUN npm run build

CMD [ "node", "dist/app.js" ]
