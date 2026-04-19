# ---------------------------
# 1. BASE IMAGE
# ---------------------------
FROM node:18-alpine

# ---------------------------
# 2. WORKDIR
# ---------------------------
WORKDIR /app

# ---------------------------
# 3. COPY PACKAGE FILES FIRST
# (Faster builds using caching)
# ---------------------------
COPY package.json package-lock.json* ./

# ---------------------------
# 4. INSTALL DEPENDENCIES
# ---------------------------
RUN npm install --omit=dev

# ---------------------------
# 5. COPY THE BACKEND SOURCE
# ---------------------------
COPY . .

# ---------------------------
# 6. ENVIRONMENT VARIABLES
# ---------------------------
# Uncomment this if you want Docker to copy .env
# COPY .env .env

# ---------------------------
# 7. EXPOSE YOUR PORT
# ---------------------------
EXPOSE 5000

# ---------------------------
# 8. START THE SERVER
# ---------------------------
CMD ["node", "server.js"]
