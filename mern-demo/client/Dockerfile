FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# URL backend được "nhúng" vào bản build; ghi đè bằng --build-arg VITE_API_URL=...
ARG VITE_API_URL=https://mern-backend-235191.onrender.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]