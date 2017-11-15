# Brf Energi

[![Website](https://img.shields.io/website-up-down-green-red/http/shields.io.svg?label=brfenergi.se&style=flat-square)](brfenergi.se) [![GitHub tag](https://img.shields.io/github/tag/CIVIS-project/BRFApp.svg?style=flat-square)]() [![style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/CIVIS-project/BRFApp)

## Setup

The application runs on [Node.js](https://nodejs.org) (version 8 or above) and [mongodb](https://docs.mongodb.com/manual/).

### Install dependencies

```bash
$ npm install
```

### Environment

Configuration variables are read from the file `.env` that is created when installing dependencies, make sure to fill in what is missing before running the application.

## Running the application

Fire up mongodb and run the appropiate command.

```bash
# If mongo is running and environment variables are exported elsewhere
$ npm start

# Start mongo, server and watch for file changes
$ npm restart
```

## Running code inspection

Make sure that tests pass before pushing your code into the repository.

```bash
$ npm test
```

## Licence

Apache 2.0, see [LICENSE](/LICENSE)
