# BRF Energi

[![Join the chat at https://gitter.im/CIVIS-project/CIVIS](https://img.shields.io/badge/gitter-join%20chat-green.svg)](https://gitter.im/CIVIS-project/YouPower?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/CIVIS-project/YouPower.svg?branch=master)](https://travis-ci.org/CIVIS-project/YouPower)
[![Coverage Status](https://coveralls.io/repos/CIVIS-project/YouPower/badge.svg?branch=master)](https://coveralls.io/r/CIVIS-project/YouPower?branch=master)

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
NODE_ENV=development

# Client
MAPBOX_ACCESS_TOKEN=<MAPBOX_TOKEN_HERE>
MAPBOX_STYLE=mapbox://styles/tornqvist/ciye3wh1c000s2sqyhepqpnrz

# Generic OAuth
BRFENERGI_CLIENT_URL=http://localhost:8100/#/
BRFENERGI_SERVICE_URL=http://localhost:3000
BRFENERGI_SESSION_SECRET=such_secret_must_never_tell

# Metry OAuth credentials
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
MONGO_URL=localhost:27017/brf-energi
```

## Running the application

Fire up mongodb. Provide credentials and address in your `.env` file (see [Environment](#environment)).

```bash
$ npm start
```

To have the server watch for changes and restart when needed

```bash
$ npm restart
```

## Running unit tests

Make sure that unit tests pass before pushing your code into the repository:

```bash
$ npm test
```

### Metrics

Most REST API calls are logged into the DB. The logs can be read using the
`metricsViewer.js` tool. It takes the following options:

```bash
  -c   Colorize output
  -e   Ellipsize long lines (only show first row)
  -h   Show help
```

Run it as

```bash
$ node backend/metricsViewer.js
```

It defaults to a local mongodb instance (named youpower), you can change this
by setting the `MONGO_URL` environment variable as such:

```bash
$ MONGO_URL=mongodb://somewhere.else.com/youpower node backend/metricsViewer.js
```

## Licence

Apache 2.0, see [LICENSE](/LICENSE)
