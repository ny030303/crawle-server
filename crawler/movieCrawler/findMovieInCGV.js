const {loadChromeDriver} = require("../../CommenUtil");
const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const {getJsonData, appendDataInJson, appendLinkToTxt} = require('../fileController');
const {downloadImageToUrl} = require('../imgDownload');
const {init: dbInit, dbQuery} = require("../../controllers/dbController");
const {crawleMovieReview} = require("./crawleReviewInCGV");

(async function init() {
  const driver = await loadChromeDriver();

  // var driver = new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(new chrome.Options().headless()).build();
  // SELECT * FROM `movie` where release_date NOT LIKE '____-__-__' <<=  release_date를 알 수 없는 정보 (나중에 처리 필요)
  try {
    await dbInit();
    let sql = "SELECT a.*,b.* FROM `movie` a, `movie_score` b where a.movie_id = b.movie_id AND DATE_FORMAT(now(), '%Y-%m-%d') = left(b.created, 10) order by b.reservation_rate desc";
    //
    // let sql =  "SELECT * FROM movie WHERE production_status = '개봉' AND release_date LIKE '____-__-__' ORDER BY production_year DESC";
    let queryRes = await dbQuery("GET", sql, []);
    for (let movie of queryRes.row) {
      await driver.get("http://www.cgv.co.kr/search/movie.aspx?query=" + movie.title);
      await driver.sleep(500);
      // title, release_date, eng_title(선택)
      try {
        let noresultView, bottomView = null;
        try {
          // noresult section 찾으면
          noresultView = await driver.findElement(By.css(".col-detail > div > .sect-noresult"));
          console.log("해당 조건에 데이터가 존재하지 않음");
          appendLinkToTxt(["movie/otherMovieLink.txt", "Can't search: " + movie.movie_id + "\n"], (res) => {
          });
        } catch (err) {
          try {
            bottomView = await driver.findElement(By.css(".col-detail > div > div.paging ul"));
          } catch (error) {
            console.log("bottom nav is none");
          }
          ;

          if (bottomView) {
            let pageBtns = await bottomView.findElements(By.css("li > a"));
            let attempts = 0;
            // bottom navigation's while
            while (attempts < pageBtns.length) {
              try {
                console.log(await pageBtns[attempts].getText());
                await pageBtns[attempts].click();
                attempts += 1;
                await driver.sleep(500);
                // --find movie--
                let isBreakWhile = await findMovieInBoxList(driver, movie);

                if (isBreakWhile) {
                  console.log("찾았으니 while 나가기");
                  break;
                }
                // --------------
                if (attempts >= pageBtns.length) {
                  try {
                    let nextBtn = await driver.findElement(By.css(".btn-paging.next"));
                    await nextBtn.click();
                    attempts = 0;
                  } catch (error) {
                    console.log("while 나가기");
                    break;
                  }
                }
              } catch (error) {
                console.log("bottomView pageBtns 새로고침");
                bottomView = await driver.findElement(By.css(".col-detail > div > div.paging ul"));
                pageBtns = await bottomView.findElements(By.css("li > a"));
              }
            }
            ;
          } else {
            let isBreakWhile = await findMovieInBoxList(driver, movie);
          }
        }
        ;
      } catch (error) {
        console.log(error);
        console.log("해당 조건에 데이터가 존재하지 않음");
      }

    }

  } catch (err) {
    console.log(err);
  } finally {
    await driver.quit();
  }
})();


async function findMovieInBoxList(driver, movie) {
  let res = false;
  let movieBoxesView = await driver.findElements(By.css(".sect-chart > ul li"));
  for (let box of movieBoxesView) {
    try {
      let b_title = (await box.findElement(By.css("div.box-contents > a > strong")).getText()).trim();
      let b_release_date = (await box.findElement(By.css("div.box-contents > span.txt-info > i")).getText()).trim();
      console.log("b_title: ", b_title, " b_release_date: ", b_release_date.replace(/\./g, '-'));
      if (movie.title == b_title && movie.release_date == b_release_date.replace(/\./g, '-')) {
        console.log("movie 찾음");
        res = true;
        let mHref = (await box.findElement(By.css(".box-image > a"))).getAttribute("href");
        await crawleMovieReview(driver, movie, mHref);
        // driver, movie, link
        //
        break;
      }
    } catch (error) {
      console.log("movieBoxesView err");
      console.log(error);
    }

  }
  return res;
}