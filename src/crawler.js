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
  this.indexed = 0;
  this.baseSite = config.get('baseSite');
  this._url = this.baseSite;
  this.url = this.baseSite;

  this.crawl = function(cb){
    this.conn.spop('queue',function(err,res){
      self.url = res != null ? res : self.baseSite;
      phantom.create(function(ph){
        return ph.createPage(function(page){
          return page.open(self.url, function(status) {
            console.log("opened site? ", status);
            page.injectJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', function() {
              setTimeout(function(){
                return page.evaluate(function(){
                  var pageArray = [];
                  $('a.video-thumb-play, a.next').each(function(){
                    pageArray.push($(this).attr('href'));
                  });
                  return pageArray;
                }, function(result){
                  for(i=0;i < result.length; i++){
                    self.conn.sadd('queue',result[i]);
                  }
                  console.log("Exiting");
                  ph.exit();
                });
              }, 5000);
            });
          });
        });
      });
    });
  }
}

module.exports = Crawler;