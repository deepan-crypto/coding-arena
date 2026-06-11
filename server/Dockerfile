FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 g++

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev 
COPY src ./src

EXPOSE 5000
CMD ["node", "src/server.js"]
