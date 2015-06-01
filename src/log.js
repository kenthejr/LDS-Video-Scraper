import bunyan from "bunyan"
import config from "config"

let log = bunyan.createLogger({
  name: "scraper",
  stream: process.stdout,
  level: config.get("logLevel")
})

export default log
