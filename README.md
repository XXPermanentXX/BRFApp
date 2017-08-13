# BRF Energi

[![Join the chat at https://gitter.im/CIVIS-project/CIVIS](https://img.shields.io/badge/gitter-join%20chat-green.svg)](https://gitter.im/CIVIS-project/YouPower?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Setup

The application runs on [Node.js](https://nodejs.org) (version 6 or above) and [mongodb](https://docs.mongodb.com/manual/).

### Install dependencies

```bash
$ npm install
```

### Environment

Create a file named `.env` in the project root (same folder as this file). Fill in the blanks and change properties as needed based on this example.

```bash
# Environment
PORT=3000
BRFENERGI_LANG=sv
NODE_ENV=development

# Mapbox
MAPBOX_ACCESS_TOKEN=<MAPBOX_TOKEN_HERE>
MAPBOX_STYLE=mapbox://styles/tornqvist/ciye3wh1c000s2sqyhepqpnrz

# OAuth
BRFENERGI_SERVICE_URL=http://localhost:3000
BRFENERGI_SESSION_SECRET=<SOME_STRING>

# Metry credentials
METRY_CLIENT_ID=<CLIENT_ID_HERE>
METRY_CLIENT_SECRET=<CLIENT_SECRET_HERE>
METRY_BASE_URL=https://app.metry.io/
METRY_PATH_TOKEN=oauth/token
METRY_PATH_AUTHORIZE=oauth/authorize
METRY_ENDPOINT_URL=https://app.metry.io/api/2.0/
METRY_PROFILE_PATH=accounts/me

# CMS
PRISMIC_API=https://brf-energi.cdn.prismic.io/api

# Database
MONGO_URL=localhost:27017/brf-energi-dev
```

## Running the application

Fire up mongodb and run the appropiate command.

```bash
# If environment variables have been set elsewhere
$ npm start

# If environment variables have been saved to a local .env file
$ node -r dotenv/config index.js

# To have the server restart on file changes and expose inpector on default port (9229)
$ npm restart
```

## Running code inspection

Make sure that unit tests pass before pushing your code into the repository.

```bash
$ npm test
```

## Licence

Apache 2.0, see [LICENSE](/LICENSE)
