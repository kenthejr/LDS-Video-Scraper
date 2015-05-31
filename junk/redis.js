var Redis = require('ioredis');
var redis = new Redis(32768, '78.48.1.15');

redis.sadd('pages',['http://www.launchbadge.com','http://www.google.com','http://www.hotmail.com','http://www.launchbadge.com']);
redis.smembers('pages', function(err, res){
  console.log(res);
});

redis.spop('pages',function(err, res){
  console.log(res);
});