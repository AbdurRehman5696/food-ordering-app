FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/seed.js && node src/server.js"]
