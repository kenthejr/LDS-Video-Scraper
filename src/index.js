import config from "config"
import log from "./log"
import path from "path"
import cheerio from "cheerio"
import phantom from "node-phantom-simple"

let webdriver = null

const CHUNK_SIZE = 1

async function setup() {
  // Create a phantom.js webdriver
  webdriver = await new Promise(function(resolve, reject) {
    phantom.create(function(err, driver) {
      if (err) reject(err)
      else resolve(driver)
    }, {
      // Point at the phantomjs binary installed through npm
      path: path.join(__dirname, "..node_modules/phantomjs/bin/")
    })
  })
}

async function teardown() {
  if (webdriver) {
    // Release the phantom.js webdriver and its resources
    webdriver.exit()
    webdriver = null
  }
}

// Get the HTML from a page by rendering it using phantomjs
function fetch(url, timeout=250) {
  return new Promise(function(resolve, reject) {
    webdriver.createPage(function(err, page) {
      if (err) return reject(err)
      page.open(url, function(err, status) {
        if (err) return reject(err)
        setTimeout(function() {
          page.evaluate(function() {
            return document.body.outerHTML
          }, function(err, result) {
            if (err) return reject(err)
            resolve(result)
          })
        }, timeout)
      })
    })
  })
}

async function main() {
  try {
    await setup()

    let pages = [config.get("baseSite")]

    while (pages.length > 0) {
      let nextPages = pages.splice(0, CHUNK_SIZE)

      let tasks = []
      let videos = []
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
        function pull(format) {
          let item = downloadContainer.find(`.${format}`)[0]
          if (item != null) {
            log.info({format},"found video at",item.attribs.href)
            videos.push({url: item.attribs.href, format})
          }
        }

        pull("360p")
        pull("720p")
        pull("1080p")
      }
    }
  } catch(err) {
    log.fatal(err)
  } finally {
    await teardown()
  }
}

main()
