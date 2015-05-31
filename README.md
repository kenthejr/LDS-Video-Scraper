# LDS-Video-Scraper
Scrape LDS.org for Videos

## Dependencies
* Phantom
* Asyc
* IORedis

## Pre-requisites
* Running Redis server

## Configuration
Populate `config.json` with an object having the properties:
* 'baseSite' - URL starting point for crawler; REQUIRED
* 'redisHost' - Host or IP address of Redis server; Default is `127.0.0.1`
* 'redisPort' - Port of Redis server; Default is `6379`