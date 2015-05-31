var async = require('async');
var Redis = require('ioredis');
var phantom = require('phantom');

var config = require('./configLoader.js');

config.load(__dirname + '/../config.json');

var Crawler = function(){
  var self = this;
  var host = config.get('redisHost') ? config.get('redisHost') : '127.0.0.1';
  var port = config.get('redisPort') ? config.get('redisPort'): '6379';
  this.conn = new Redis(port, host);
  this.baseSite = config.get('baseSite');
  this.url = this.baseSite;

  this.crawl = function(cb){
    var isBaseCrawled = false;
    self.conn.sismember('crawled', self.baseSite, function(err,res){
      isBaseCrawled == !!res;
    });
    self.conn.sdiff('queue','crawled', function(err,res){
      if(!isBaseCrawled || res.length > 0){
        self.url = (res.length > 0 && !!res[0] != false) ? res[0] : self.baseSite;
        phantom.create(function(ph){
          return ph.createPage(function(page){
            return page.open(self.url, function(status) {
              console.log("Start");
              page.injectJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', function() {
                setTimeout(function(){
                  return page.evaluate(function(){
                    var pageArray = [];
                    var videoArray = [];
                    $('a.video-thumb-play, a.next').each(function(){
                      pageArray.push($(this).attr('href'));
                    });
                    console.log("test");
                    if ($('#download-popup a.720p').length) {
                      console.log($('#download-popup a.720p').attr('href'));
                      videoArray.push($('#download-popup a.720p').attr('href'));
                    } else if ($('#download-popup a.360p').length) {
                      videoArray.push($('#download-popup a.360p').attr('href'));
                    } else if ($('#download-popup a.1080p').length) {
                      videoArray.push($('#download-popup a.1080p').attr('href'));
                    }
                    return [pageArray, videoArray];
                  }, function(result){
                    for(i=0;i < result[0].length; i++){
                      self.conn.sadd('queue',result[0][i]);
                    }
                    for(i=0;i < result[1].length; i++){
                      self.conn.sadd('videos',result[1][i]);
                    }
                    console.log("Stop");
                    self.conn.sadd('crawled',self.url);
                    ph.exit();
                    cb();
                  });
                }, 5000);
              });
            });
          });
        });
      } else {
        console.log("No queue");
        cb();
      }
    });
  }
}

module.exports = Crawler;