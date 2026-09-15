FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# --host binds Vite to 0.0.0.0 so it's reachable from outside the container
CMD ["npm", "run", "dev", "--", "--host"]
