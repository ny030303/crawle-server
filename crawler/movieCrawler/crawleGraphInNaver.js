const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const {getJsonData, appendDataInJson, appendLinkToTxt} = require('../fileController');
const {init: dbInit, dbQuery, getTodayMovies} = require("../../controllers/dbController");
const iconv = require("iconv-lite");

const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const { getNowDateToYYMMDD, loadChromeDriver } = require('../../CommenUtil');

const implicit_wait = {implicit: 5000, pageLoad: 5000};

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

async function changeNaverMovieSearch(driver, title) {
  await driver.get(`https://movie.naver.com`);
  await driver.manage().setTimeouts(implicit_wait);
  await driver.findElement(By.id('ipt_tx_srch')).sendKeys(title, Key.ENTER);
  await driver.manage().setTimeouts(implicit_wait);
  await driver.findElement(By.css('#old_content > ul.search_menu > li:nth-child(2) > a')).click();
  await driver.manage().setTimeouts(implicit_wait);
  console.log('my procedure waiting...');
  await driver.sleep(1000);
}

const movieInfoByWebDriver = async (movie) => {
  const driver = await loadChromeDriver('lang=ko_KR');
  try {
    console.log(movie.title);
    await changeNaverMovieSearch(driver, movie.title);
    // /movie/search/result.nhn?section=movie&query=${movie.title}`);

    // await driver.manage().timeouts().implicitlyWait(10);

    // await driver.wait(driver.until.titleMatches(/BrowserStack/i), 5);
    let noresultView = await driver.findElement(By.css("#old_content > table > tbody > tr > td"));
    console.log("해당 조건에 데이터가 존재하지 않음", noresultView);
  } catch (err) {
    // console.log(err);
    try {
      await findMovieInBoxList(driver, movie);
    } catch (error) {
      console.log(error);
    }
  } finally {
    try {
      await driver.close();
      await console.log("✨ graph finished ✨");

      // 일반적으로 driver.close()브라우저를 닫고(드라이버 인스턴스는 그대로 driver.quit()유지됨) webdriver 인스턴스를 종료합니다.
    } catch (ter) {
      console.log(ter);
    }
    
  }
};

exports.crawleGraph2 = async () => {
  try {
    let queryRes = await getTodayMovies();
    for(const movies of queryRes.row.division(5)) {
      await Promise.all(movies.map(v => movieInfoByWebDriver(v)));
    }
  } catch (error) {
    console.log(error);
  }
}

exports.crawleGraph = async function crawleGraph() {
  try {

    var driver = await loadChromeDriver('lang=ko_KR');
    // const chrome = require('selenium-webdriver/chrome');
    // const chromedriver = require('chromedriver');

    // chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    // // var driver = new Builder().withCapabilities(Capabilities.chrome()).build();

    // var driver = new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(new chrome.Options().headless()).build();
   
   
    // SELECT * FROM `movie` where release_date NOT LIKE '____-__-__' <<=  release_date를 알 수 없는 정보 (나중에 처리 필요)
    
    let queryRes = await getTodayMovies();
    // await dbInit();
    // let sql = "SELECT a.*,b.* FROM `movie` a, `movie_score` b where a.movie_id = b.movie_id AND DATE_FORMAT(now(), '%Y-%m-%d') = left(b.created, 10) order by b.reservation_rate desc";
    // let queryRes = await dbQuery("GET", sql, []);
    // console.log(queryRes.row);
    for (let movie of queryRes.row) {
      await driver.get("https://movie.naver.com/movie/search/result.nhn?section=movie&query=" + movie.title);
      // await driver.wait(driver.until.titleMatches(/BrowserStack/i), 500);
      // title, release_date, eng_title(선택)
      try {
        let noresultView, bottomView = null;
        try {
          // noresult section 찾으면
          noresultView = await driver.findElement(By.css("#old_content > table > tbody > tr > td"));
          console.log("해당 조건에 데이터가 존재하지 않음");
          appendLinkToTxt(["movie/otherMovieLink.txt", "Can't search: " + movie.movie_id + "\n"], (res) => {
          });
        } catch (err) {
          let nextBtn;
          try {
            nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
          } catch (error) {

          }

          if (nextBtn) {
            // bottom navigation's while
            while (nextBtn) {
              try {
                // --find movie--
                let isBreakWhile = await findMovieInBoxList(driver, movie);

                if (isBreakWhile) { break; }
                try {
                  nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
                  await nextBtn.click();
                  await driver.sleep(500);
                } catch (error) {
                  // console.log("while 나가기");
                  break;
                }
              } catch (error) {
                // console.log("nextBtn 새로고침");
                nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
              }
            }
          } else {
            let isBreakWhile = await findMovieInBoxList(driver, movie);
          }
        }
      } catch (error) {
        console.log(error);
        console.log("해당 조건에 데이터가 존재하지 않음");
      }
    }
  } catch (err) {
    console.log(err);
  } finally {
    await driver.quit();
    await console.log("✨ graph finished ✨");
  }
};


async function findMovieInBoxList(driver, movie) {
  let res = false;
  let movieBoxesView = await driver.findElements(By.css("#old_content > ul.search_list_1 li"));
  for (let box of movieBoxesView) {
    try {
      let b_title = (await box.findElement(By.css("dl > dt > a")).getText()).trim().split(" (")[0];
      // let b_release_date = (await box.findElement(By.css("dl > dd:nth-child(3) > a:nth-child(8)")).getText()).trim();
      // console.log("b_title: ", b_title, " b_release_date: ", b_release_date);
      if (movie.title == b_title) {
        // console.log("movie 찾음");
        res = true;
        let mHref = (await box.findElement(By.css("p > a")).getAttribute("href"));
        // console.log(mHref);
        let mId = mHref.split("code=")[1];
        // console.log(mId);
        await crawleMovieGraph(driver, movie, "https://movie.naver.com/movie/bi/mi/point.nhn?code=" + mId);
        // driver, movie, link
        break;
      }
    } catch (error) {
      console.log("movieBoxesView err");
      console.log(error);
    }

  }
  return res;
}

async function crawleMovieGraph(driver, movie, url) {
  try {
    await driver.get(url);
    // console.log(movie, url);
    await driver.sleep(500);
    // await (await driver.findElement(By.css("#actual_point_tab"))).click();
    // await driver.sleep(1000);

    try {
      let graphJson = {
        "movie_id": movie.movie_id,
        "site": "naver",
        "created": "now()",
        "jqplot_sex": {
          "mal": Number((await driver.findElement(By.css("#actualGenderGraph > svg > text:nth-child(4) > tspan")).getText()).slice(0, -1)),
          "fem": Number((await driver.findElement(By.css("#actualGenderGraph > svg > text:nth-child(6) > tspan")).getText()).slice(0, -1))
        },
        "jqplot_age": {
          "10": Number((await driver.findElement(By.css(".mv_info > .viewing_graph > div > .bar_graph > div:nth-child(1) > strong.graph_percent")).getText()).slice(0, -1)),
          "20": Number((await driver.findElement(By.css(".mv_info > .viewing_graph > div > .bar_graph > div:nth-child(2) > strong.graph_percent")).getText()).slice(0, -1)),
          "30": Number((await driver.findElement(By.css(".mv_info > .viewing_graph > div > .bar_graph > div:nth-child(3) > strong.graph_percent")).getText()).slice(0, -1)),
          "40": Number((await driver.findElement(By.css(".mv_info > .viewing_graph > div > .bar_graph > div:nth-child(4) > strong.graph_percent")).getText()).slice(0, -1)),
          "50": Number((await driver.findElement(By.css(".mv_info > .viewing_graph > div > .bar_graph > div:nth-child(5) > strong.graph_percent")).getText()).slice(0, -1)),
        },
        "charm_point": {
          "derected": Number((await driver.findElement(By.css("#netizenEnjoyPointGraph > svg > text:nth-child(4) > tspan")).getText()).slice(0, -1)),
          "actor": Number((await driver.findElement(By.css("#netizenEnjoyPointGraph > svg > text:nth-child(6) > tspan")).getText()).slice(0, -1)),
          "story": Number((await driver.findElement(By.css("#netizenEnjoyPointGraph > svg > text:nth-child(8) > tspan")).getText()).slice(0, -1)),
          "visual_beauty": Number((await driver.findElement(By.css("#netizenEnjoyPointGraph > svg > text:nth-child(10) > tspan")).getText()).slice(0, -1)),
          "ost": Number((await driver.findElement(By.css("#netizenEnjoyPointGraph > svg > text:nth-child(12) > tspan")).getText()).slice(0, -1))
        }
      };
      let nowDate = getNowDateToYYMMDD();


      res = await dbQuery("GET", "SELECT * FROM movie_graph WHERE movie_id = ? AND site = 'naver'", [graphJson.movie_id]);
      // console.log(res.row);
      if (res.row.length > 0) {
        let sql = "UPDATE movie_graph SET `created`=?,`jqplot_sex`=?,`jqplot_age`=?,`charm_point`=? WHERE movie_id = ? AND site = 'naver'";
        let params = [nowDate, JSON.stringify(graphJson.jqplot_sex), JSON.stringify(graphJson.jqplot_age), JSON.stringify(graphJson.charm_point), graphJson.movie_id];
        let queryRes = await dbQuery("UPDATE", sql, params);
      } else {
        let sql = "INSERT INTO movie_graph VALUES (?,?,?, ?,?,?)";
        let queryRes = await dbQuery("INSERT", sql, [graphJson.movie_id, graphJson.site, nowDate,
          JSON.stringify(graphJson.jqplot_sex), JSON.stringify(graphJson.jqplot_age), JSON.stringify(graphJson.charm_point)]);
      
          // console.log(queryRes);
      }
      console.log(graphJson);

    } catch (error) {
      // console.log();
    }
  } catch (err) {
    console.log(err);
  }
}