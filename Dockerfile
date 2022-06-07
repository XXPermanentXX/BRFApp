FROM node:16-alpine

ARG NODE_ENV

# create directory
WORKDIR /usr/src/app

# install dependencies
COPY package*.json ./
RUN if [ "$NODE_ENV" != "development" ]; then npm ci --only=production; else npm install; fi

# copy files
COPY . .

# expose port
EXPOSE 8080

# build client
RUN if [ "$NODE_ENV" != "development" ]; then npm run build; fi

# start server
CMD npm start
