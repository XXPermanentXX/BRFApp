FROM node:carbon

RUN mkdir /code
WORKDIR /code
ADD ./package.json /code/package.json
ADD ./package-lock.json /code/package-lock.json
RUN npm install
EXPOSE 9229

CMD if [ "$NODE_ENV" = "development" ]; then node --inspect=0.0.0.0:9229 server.js; else npm start; fi
