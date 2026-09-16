FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 43123
VOLUME ["/app/data"]
CMD ["npm", "start"]
