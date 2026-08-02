FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

RUN chmod +x start.sh

EXPOSE 4000

CMD ["./start.sh"]