# Use the official Node.js image from Docker Hub
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (including PM2)
RUN npm install

# Install PM2 globally (if not added to package.json dependencies)
RUN npm install pm2 -g

# Copy the rest of the application code
COPY . .

# Expose the port your app will run on (adjust based on your app's configuration)
EXPOSE 3000

# Start the app using PM2 (it will use ecosystem.config.js to run the app)
CMD ["pm2-runtime", "ecosystem.config.js"]
