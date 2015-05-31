var Redis = require('ioredis');

var redis = new Redis("32768", "78.48.1.15");

redis.smembers('crawled', function(err,res){console.log("Crawled: " + res.length);});
redis.smembers('videos', function(err,res){console.log("Videos: " + res.length);});
redis.sdiff('queue','crawled', function(err,res){console.log("Queued: " + res.length)});
redis.sdiff('queue','crawled', function(err,res){console.log("Next: " + res[0])});
//redis.sismember('crawled','https://www.lds.org/media-library/video/2014-06-011-the-ward-council-were-all-in-this-together?lang=eng&category=auxiliary-training-videos/2014-auxiliary-training',function(err,res){console.log(!!res);});
