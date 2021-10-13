const {loadChromeDriver} = require("../../CommenUtil");
const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const {downloadImageToUrl} = require('../imgDownload');
const {getJsonData, appendDataInJson, appendLinkToTxt, writeJsonData} = require('../fileController');
const {init: dbInit, dbQuery} = require("../../controllers/dbController");
(async function example() {
  const driver = loadChromeDriver();

  try {
    await dbInit();

    // Navigate to Url
    await driver.get('https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do');
    await driver.sleep(500);
    await (driver.findElement(By.css(".slt_comm #sOrderBy > option:nth-child(4)"))).click();
    await driver.sleep(500);

    let pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
    let attempts = 0;
    let savePoint = false;
    while (attempts < pageBtns.length) {
      try {
        // if(!savePoint) { // page.json와 같은 btn 번호 찾기
        //     for(let btnNum = 0; btnNum < pageBtns.length; btnNum++) {
        //         let num  = Number(await pageBtns[btnNum].getText());
        //         console.log(num, pages.movieCrawler);
        //         if(num != pages.movieCrawler) {
        //             attempts += 1;
        //         } else {
        //             savePoint = true;
        //             break;
        //         }
        //     }
        // } else {
        let nowPage = Number(await pageBtns[attempts].getText());
        console.log(nowPage, pages.movieCrawler);
        await pageBtns[attempts].click();
        attempts += 1;
        await driver.sleep(600);

        let mListView = await driver.findElements(By.css("#content > div.rst_sch > table > tbody > tr"));
        //List foreach
        for (let rev of mListView) {
          try {
            let title = rev.findElement(By.css("td:nth-child(1) > span > a"));
            let revJson = {
              "movie_id": (await (rev.findElement(By.css("td:nth-child(3) > span"))).getText()).trim(),
              "title": (await title.getText()).trim(),
              "eng_title": (await rev.findElement(By.css("td:nth-child(2) > span > a")).getText()).trim(),
              "production_year": (await rev.findElement(By.css("td:nth-child(4) > span")).getAttribute("title")).trim(),
              "production_country": (await rev.findElement(By.css("td:nth-child(5) > span")).getAttribute("title")).trim(),
              "size_type": (await rev.findElement(By.css("td:nth-child(6) > span")).getAttribute("title")).trim(),
              "genore": (await rev.findElement(By.css("td:nth-child(7) > span")).getAttribute("title")).trim(),
              "production_status": (await rev.findElement(By.css("td:nth-child(8) > span")).getAttribute("title")).trim(),
              "poster_img": null,
              "release_date": null,
              "updated_date": null,
              "memo": null,
              "director": (await rev.findElement(By.css("td:nth-child(9) > span")).getAttribute("title")).trim(),
              "actor": {},
              "story": ""
            };
            // console.log(revJson);
            await title.click();
            await driver.sleep(500);

            let href = await (await driver.findElement(By.css(".item_tab.basic > div.ovf.info.info1 > a"))).getAttribute("href");
            // console.log(href);
            let urlArr = href.split("/");
            let imgLink = `${Date.now()}_${urlArr[urlArr.length - 1]}`;
            if (urlArr[urlArr.length - 1] == "searchMovieList.do#") {
              revJson.poster_img = "";
            } else {
              revJson.poster_img = imgLink;
            }

            revJson.memo = (await driver.findElement(By.css(".item_tab.basic > div.ovf.info.info1 > dl > dd:nth-child(8)")).getText()).trim();
            revJson.updated_date = (await driver.findElement(By.css(".item_tab.basic > div.bar_top > div")).getText()).trim().split("최종수정: ")[1].split(" 수정요청")[0];
            let dts = await driver.findElements(By.css(".item_tab.basic dl > *"));
            let dtNum = 0;
            for (let dt of dts) {
              dtName = (await dt.getText()).trim();
              if (dtName == "개봉일") {
                console.log("ㄱㅐ봉일" + (await dts[dtNum + 1].getText()));
                revJson.release_date = (await dts[dtNum + 1].getText());
                break;
              }
              dtNum++;
            }

            try {
              revJson.story = (await driver.findElement(By.css(".item_tab.basic  p.desc_info")).getText()).trim();
            } catch (error) {
              revJson.story = "";
            }
            // console.log(revJson);

            await driver.findElement(By.css("div.hd_layer > a:nth-child(3)")).click();
            await driver.sleep(500);

            try {
              // 원래 있는 데이터 업데이트
              res = await dbQuery("GET", "SELECT * FROM movie WHERE movie_id = ?", [revJson.movie_id]);
              if (res.row.length > 0) {
                console.log(res.row[0].updated_date, revJson.updated_date);
                if (res.row[0].updated_date != revJson.updated_date) {
                  let sql = "UPDATE `movie` SET `title`=?,`eng_title`=?,`production_year`=?,`production_country`=?,`size_type`=?,`genore`=?,`production_status`=?,`poster_img`=?,`release_date`=?,`updated_date`=?,`memo`=?,`director`=?,`actor`=?,`story`=? WHERE `movie_id`=?";
                  let imgUrl;
                  if (res.row[0].poster_img == "") imgUrl = revJson.poster_img;
                  else imgUrl = res.row[0].poster_img;
                  let params = [revJson.title, revJson.eng_title, revJson.production_year, revJson.production_country, revJson.size_type, revJson.genore,
                    revJson.production_status, imgUrl, revJson.release_date, revJson.updated_date, revJson.memo,
                    revJson.director, JSON.stringify(revJson.actor), revJson.story, revJson.movie_id];
                  let queryRes = await dbQuery("UPDATE", sql, params);
                  if (!queryRes.error) {
                    if (urlArr[urlArr.length - 1] != "searchMovieList.do#" && imgUrl == revJson.poster_img) {
                      downloadImageToUrl(href, imgLink);
                    }
                  }
                  console.log(" updated => " + revJson.movie_id);
                } else {
                  console.log("no updated");

                }
              } else {
                let sql = "INSERT INTO movie VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?)";
                let params = [revJson.movie_id, revJson.title, revJson.eng_title, revJson.production_year, revJson.production_country,
                  revJson.size_type, revJson.genore, revJson.production_status, revJson.poster_img, revJson.release_date,
                  revJson.updated_date, revJson.memo, revJson.director, JSON.stringify(revJson.actor), revJson.story];
                let queryRes = await dbQuery("INSERT", sql, params);
                console.log(" inserted => " + revJson.movie_id);
                // console.log(queryRes);
                if (!queryRes.error) {
                  if (urlArr[urlArr.length - 1] != "searchMovieList.do#") {
                    downloadImageToUrl(href, imgLink);
                  }
                }
              }

              //
            } catch (error) {
              console.log("db 오류");
            }


            // pages.movieCrawler = pages.movieCrawler + 1;
            // writeJsonData("pages.json", pages, ()=> {

            // })
          } catch (error) {
            console.log(error);
          }
          // appendDataInJson(["movie/movie.json", movieInfo, movieData], (res)=> {});
        }
        // }


        if (attempts >= pageBtns.length) {
          try {
            let nextBtn = await driver.findElement(By.css("#pagingForm > div > a.btn.next"));
            await nextBtn.click();
            await driver.sleep(500);
            pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
            attempts = 0;
            console.log(attempts);
          } catch (error) {
            console.log(error);
            console.log("while 나가기");
            break;
          }
        }
      } catch (err) {
        console.log("pageBtns 새로고침");
        // console.log(err);
        pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
        mListView = await driver.findElements(By.css("#content > div.rst_sch > table > tbody > tr"));
      }
    }
  } finally {
    console.log("✨ finished ✨");
    driver.quit();
  }
})();


// attempts 223번까지 했음.
