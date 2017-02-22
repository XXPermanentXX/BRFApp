# BRF Energi

[![Join the chat at https://gitter.im/CIVIS-project/CIVIS](https://img.shields.io/badge/gitter-join%20chat-green.svg)](https://gitter.im/CIVIS-project/YouPower?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/CIVIS-project/YouPower.svg?branch=master)](https://travis-ci.org/CIVIS-project/YouPower)
[![Coverage Status](https://coveralls.io/repos/CIVIS-project/YouPower/badge.svg?branch=master)](https://coveralls.io/r/CIVIS-project/YouPower?branch=master)

## Setup

The application runs on [Node.js](https://nodejs.org) and requires version 6.0.0 or above (latest recommended). Also required are [graphicsmagick](http://www.graphicsmagick.org) and [mongodb](https://docs.mongodb.com/manual/).

### Install dependencies

```bash
$ npm install
```

### Environment

Create a file named `.env` in the project root (same folder as this file). Fill in the blanks and change properties as needed based on this example.

```bash
# Server
BRFENERGI_CLIENT_URL=http://localhost:8100/#/
BRFENERGI_SERVICE_URL=http://localhost:3000

# Metry OAuth credentials
METRY_CLIENT_ID=<CLIENT_ID_HERE>
METRY_CLIENT_SECRET=<CLIENT_SECRET_HERE>
METRY_BASE_URL=https://app.metry.io/
METRY_PATH_TOKEN=oauth/token
METRY_PATH_AUTHORIZE=oauth/authorize
METRY_ENDPOINT_URL=https://app.metry.io/api/v2/
METRY_PROFILE_PATH=accounts/me

# Database
MONGO_URL=localhost:27017/youpower
MONGOOSE_DISABLE_STABILITY_WARNING=1

NODE_TLS_REJECT_UNAUTHORIZED="0"
```

## Running the application

Fire up mongodb. Provide credentials and address in your `env` file (see [Environment](#environment)).

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

Note that this requires a local instance of mongodb running.

*NOTE: The tests have fallen behind development and needs tending to*

## File structure

```
├──  apidoc/        - generated documentation for REST API, do not edit directly
├──  common/        - common code that is useful in multiple places
├──  middleware/    - express.js middleware
├──  models/        - database models
├──  routes/        - express.js API routes
├──  test/          - unit tests
├──  app.js         - entry point
└──  README.md      - this file
```

## Notes on apidoc

The REST API documentation is generated from inline code comments following
the JSDoc specification. Here's apidoc specific information on the syntax:
http://apidocjs.com/

The documentation webpage is generated/updated by running `gulp apidoc`. (make
sure you have installed `gulp` globally). You will then be able to browse the
API documentation at http://localhost:3000

We will try to keep every single API path documented like this.

Current API documentation of latest master available here:
https://gentle-coast-9691.herokuapp.com/

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

## Inserting default data into the database
When first launching the application it is pretty useless, since the database
is initially empty. In order to get started, populate it with some default
actions and communities using the `putDummyData.js` script.

Run it as

```bash
$ node backend/putDummyData.js
```

Just like the `metricsViewer.js` script, you can supply a custom MONGO_URL to
fill another database than the local one.

## Front End

The front end application resides in [frontend](frontend) and requries it's own dependencies and setup. See its' [README](frontend/README.md) for details.
