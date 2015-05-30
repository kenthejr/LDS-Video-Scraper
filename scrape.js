var phantom = require('phantom');
var cradle = require('cradle');

var pages_crawled = 0;
var no_results = 3;

function crawl(url, _callback) {
  phantom.create(function(ph) {
    return ph.createPage(function(page) {
      return page.open(url, function(status) {
        console.log("opened site? ", status);
        page.injectJs('https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', function() {
          setTimeout(function() {
            return page.evaluate(function() {
              var catArray = [];
              var videoArray = [];
              $('a.video-thumb-play').each(function() {
                catArray.push($(this).attr('href'));
              });
              $('a.next').each(function() {
                catArray.push($(this).attr('href'));
              });
              if ($('#download-popup a.720p').length) {
                videoArray.push($('#download-popup a.720p').attr('href'));
              } else if ($('#download-popup a.360p').length) {
                videoArray.push($('#download-popup a.360p').attr('href'));
              } else if ($('#download-popup a.1080p').length) {
                videoArray.push($('#download-popup a.1080p').attr('href'));
              }
              return {'categories': catArray,'videos': videoArray};
            }, function(result) {
              var urlDB = new(cradle.Connection)().database('urls');
              for (i = 0; i < result.categories.length; i++) {
                urlDB.save(result.categories[i], {'crawled': false}, function(err, res) {
                  if (err) console.log(err);
                });
              }
              console.log("Categories: " + result.categories.length);
              for (i = 0; i < result.videos.length; i++) {
                urlDB.save(result.videos[i], {'downloaded': false}, function(err, res) {
                  if (err) console.log(err);
                });
              }
              console.log("Videos: " + result.videos.length);
              ph.exit();
              _callback();
            });
          }, 5000);
        });
      });
    });
  });
}

function getViews() {
  var db = new(cradle.Connection)().database('urls');
  db.save('_design/urls', 
    {
      pages: {
        map: function(doc) {
          if (doc.crawled == false) emit(doc._id, doc);
        }
      },
      videos: {
        map: function(doc) {
          if (doc.downloaded == false) emit(doc._id, doc);
        }
      }
    },
    function(err, res) {
      var pages = db.view('urls/pages', function(err, res) {
        if (err) console.log("View Query Error: " + err);
        if (res.length) {
          res.forEach(function(key, row, id) {
            crawl(id, function() {
              db.save(id, {crawled: true}, function(err, res) {
                if (err) {
                  console.log("Write Error: " + err);
                } else {
                  pages_crawled += 1;
                  console.log("Crawled: " + id);
                }
              });
              console.log(id);
            });
          });
          return true;
        } else {
          return false;
        }
      });
    }
  );
}

//crawl("https://www.lds.org/media-library/video/categories?lang=eng&start=1&end=15", function(){});

getViews();
