# Use Node.js 18
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm install (not npm ci)
RUN npm install --production

# Copy app source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
