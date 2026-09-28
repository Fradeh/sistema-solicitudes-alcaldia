FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm install

FROM node:20-alpine AS development

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
