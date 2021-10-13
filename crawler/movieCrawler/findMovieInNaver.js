const {loadChromeDriver} = require("../../CommenUtil");
const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const {getJsonData, appendDataInJson, appendLinkToTxt} = require('../fileController');
const {downloadImageToUrl} = require('../imgDownload');
const {init: dbInit, dbQuery} = require("../../controllers/dbController");
const {crawleMovieReview} = require("./crawleReviewInNaver");

(async function init() {
  const driver = await loadChromeDriver();

  // var driver = new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(new chrome.Options().headless()).build();
  // SELECT * FROM `movie` where release_date NOT LIKE '____-__-__' <<=  release_date를 알 수 없는 정보 (나중에 처리 필요)
  try {
    await dbInit();
    let sql = "SELECT * FROM `movie` a, `movie_score` b where a.movie_id = b.movie_id AND DATE_FORMAT(now(), '%Y-%m-%d') = left(b.created, 10) order by b.reservation_rate desc";
    let queryRes = await dbQuery("GET", sql, []);
    for (let movie of queryRes.row) {
      console.log(movie);
      await driver.get('https://movie.naver.com/movie/search/result.naver?section=movie&query=' + encodeURI(movie.title));
      await driver.sleep(500);
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
            console.log("nextBtn is none");
          }
          ;

          if (nextBtn) {
            // bottom navigation's while
            while (nextBtn) {
              try {
                // --find movie--
                let isBreakWhile = await findMovieInBoxList(driver, movie);

                if (isBreakWhile) {
                  console.log("찾았으니 while 나가기");
                  break;
                }

                try {
                  nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
                  await nextBtn.click();
                  await driver.sleep(500);
                } catch (error) {
                  console.log("while 나가기");
                  break;
                }
              } catch (error) {
                console.log("nextBtn 새로고침");
                nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
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
    console.log("✨ finished ✨");
    await driver.quit();
  }
})();


async function findMovieInBoxList(driver, movie) {
  let res = false;
  let movieBoxesView = await driver.findElements(By.css("#old_content > ul.search_list_1 li"));
  for (let box of movieBoxesView) {
    try {
      let b_title = (await box.findElement(By.css("dl > dt > a")).getText()).trim().split(" (")[0];
      // let b_release_date = (await box.findElement(By.css("dl > dd:nth-child(3) > a:nth-child(8)")).getText()).trim();
      // console.log("b_title: ", b_title, " b_release_date: ", b_release_date);
      if (movie.title == b_title) {
        console.log("movie 찾음");
        res = true;
        let mHref = (await box.findElement(By.css("p > a")).getAttribute("href"));
        // console.log(mHref);
        let mId = mHref.split("code=")[1];
        console.log(mId);
        await crawleMovieReview(driver, movie, "https://movie.naver.com/movie/bi/mi/pointWriteFormList.nhn?code=" + mId +
          "&type=after&isActualPointWriteExecute=false&isMileageSubscriptionAlready=false&isMileageSubscriptionReject=false");
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