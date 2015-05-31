var config = require("../src/configLoader");

config.load(__dirname + '/../config.json');

console.log(config.get("test"));