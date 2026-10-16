FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
# Chạy `npm install` trong server/ một lần để sinh package-lock.json, rồi đổi thành `npm ci --omit=dev`
RUN npm install --omit=dev
COPY . .
USER node
EXPOSE 5000
CMD ["npm", "start"]
