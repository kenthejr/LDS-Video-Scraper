var Crawler = require('./crawler.js');
var async = require('async');

var spider = new Crawler();

async.forever(
  function(next){
    spider.crawl(function(){
      process.nextTick(function(){
        next(null);
      })
    });
  },
  function(err){
    console.log(err);
  }
);