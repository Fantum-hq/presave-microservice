# Step 1: Use the official Node.js image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Install pm2 globally
RUN npm install -g pm2

# Step 4: Copy package.json and yarn.lock (or package-lock.json if you're using npm)
COPY package.json yarn.lock ./

# Step 5: Install dependencies
RUN yarn install --production

# Step 6: Copy the rest of the application code into the container
COPY . .

# Step 7: Expose the application port
EXPOSE 8000

# Step 8: Set the command to run pm2 and start the application
CMD ["pm2-runtime", "index.js"]