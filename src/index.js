import config from "config"
import log from "./log"
import path from "path"
import cheerio from "cheerio"
import phantom from "node-phantom-simple"
import Redis from "ioredis"

//let webdriver = null

const CHUNK_SIZE = 8

// async function setup() {
//   // Create a phantom.js webdriver
  // webdriver = await new Promise(function(resolve, reject) {
  //   phantom.create(function(err, driver) {
  //     if (err) reject(err)
  //     else resolve(driver)
  //   }, {
  //     // Point at the phantomjs binary installed through npm
  //     path: path.join(__dirname, "..node_modules/phantomjs/bin/")
  //   })
  // })
// }

// async function teardown() {
//   if (webdriver) {
//     // Release the phantom.js webdriver and its resources
//     webdriver.exit()
//     webdriver = null
//   }
// }

// Get the HTML from a page by rendering it using phantomjs
// function fetch(url, timeout=250) {
//   return new Promise(function(resolve, reject) {
//     try {
//       webdriver = await new Promise(function(resolve, reject) {
//         phantom.create(function(err, driver) {
//           if (err) reject(err)
//           else resolve(driver)
//         }, {
//           // Point at the phantomjs binary installed through npm
//           path: path.join(__dirname, "..node_modules/phantomjs/bin/")
//         })
//       })
//       webdriver.createPage(function(err, page) {
//         if (err) return reject(err)
//         page.open(url, function(err, status) {
//           if (err) return reject(err)
//           setTimeout(function() {
//             page.evaluate(function() {
//               return document.body.outerHTML
//             }, function(err, result) {
//               if (err) return reject(err)
//               resolve(result)
//             })
//           }, timeout)
//         })
//       })
//     } catch(err) {
//       log.fatal(err)
//     } finally {
//       webdriver.exit()
//       webdriver = null
//     }
//   })
// }

function fetch(url, timeout=250){
  return new Promise(function(resolve, reject){
    phantom.create(function(err,ph){
      return ph.createPage(function(err,page){
        return page.open(url, function(err, status){
          if (err) return reject(err)
          setTimeout(function(){
            page.evaluate(function(){
              return document.body.outerHTML
            }, function(err, result) {
              if (err) return reject(err)
              resolve(result)
              ph.exit()
            })
          }, timeout)
        })
      })
    }, {
      path: path.join(__dirname, "..node_modules/phantomjs/bin/")
    })
  })
}

async function main() {
  try {
    // await setup()

    let pages = [config.get("baseSite")]
    let redis = new Redis(config.get("redisPort"),config.get("redisHost"))

    while (pages.length > 0) {
      let nextPages = pages.splice(0, CHUNK_SIZE)

      let tasks = []
      for (let nextPage of nextPages) {
        tasks.push(fetch(nextPage))
      }

      let contentPages = await* tasks
      for (let contentPage of contentPages) {
        let $ = cheerio.load(contentPage)

        $("a.video-thumb-play,a.next").each(function(index, el) {
          pages.push(el.attribs.href)
        })

        let downloadContainer = $("#download-popup")
        if (downloadContainer.length === 0) continue

        function pull(priority) {
          for (let i in priority){
            let format = priority[i]
            let item = downloadContainer.find(`.${format}`)[0]
            if (item != null) {
              redis.sadd('videos',item.attribs.href,function(err,res){
                if (err) log.info(err)
              })
              log.info({format},"found video at",item.attribs.href)
              break
            }
          }
        }
        pull(config.get("priority"))
      }
    }
  } catch(err) {
    log.fatal(err)
  } finally {
    // await teardown()
  }
}

main()
