const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { downloadImageToUrl,downloadImageToUrlInS3 } = require('../imgDownload');
const {getJsonData, appendDataInJson, appendLinkToTxt} = require('../fileController');
const {init: dbInit, dbQuery, getTodayMovies} = require("../../controllers/dbController");
const iconv = require("iconv-lite");

const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const {loadChromeDriver} = require("../../CommenUtil");
const implicit_wait = {implicit: 5000, pageLoad: 5000};

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
Array.prototype.division = function (n) {
    let arr = this;
    let len = arr.length;
    let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    let ret = [];
    for (let i = 0; i < cnt; i++) {
      ret.push(arr.splice(0, n));
    }
    return ret;
  }
const loadSelenium = () => {
    let options = new chrome.Options();
    // options.headless();
    options.addArguments('--headless --disable-gpu');     // GPU 사용 안함
    options.addArguments('lang=ko_KR');      //  언어 설정
    // return new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(options).build();
    return new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(new chrome.Options().headless()).build();
}

const getMListView = async (driver) => {
    await driver.get('https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do');
    await driver.manage().setTimeouts(implicit_wait);
    await (driver.findElement(By.css(".slt_comm #sOrderBy > option:nth-child(4)"))).click();
    await driver.manage().setTimeouts(implicit_wait);
    return await driver.findElements(By.css("#content > div.rst_sch > table > tbody > tr"));
}
const findNumIdxInArrView = async (arrView, num) => {
  let arr = [];
  for(const p of arrView) arr.push(Number(await p.getText()));
  let idx = arr.findIndex((v) => v == num);
  return idx;
}

(async function example() {
  const driver = await loadChromeDriver();
    try {
      await dbInit();

      let mListView = await getMListView(driver);
        while(true) {
          await driver.manage().setTimeouts(implicit_wait);
          let pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
          await driver.manage().setTimeouts(implicit_wait);
          let numArr = [];
          for(const p of pageBtns) numArr.push(Number(await p.getText()));

          for(let btn of numArr) {
            await driver.manage().setTimeouts(implicit_wait);
            mListView = await driver.findElements(By.css("#content > div.rst_sch > table > tbody > tr"));
            await driver.manage().setTimeouts(implicit_wait);
            pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
            await driver.manage().setTimeouts(implicit_wait);

            let idx = await findNumIdxInArrView(pageBtns, btn);

            await driver.manage().setTimeouts(implicit_wait);
            await driver.sleep(2000);
            try {await pageBtns[idx].click();} 
            catch (error) { console.log("클릭 x");}
            
            console.log("btn: "+ btn);
            await driver.manage().setTimeouts(implicit_wait);
            for(const movies of mListView.division(10)) {
              await Promise.all(movies.map( async (v,i) => await movieInfoByWebDriver(btn, i)));
            }

            if(idx >= 9) {
              try {
                await driver.findElement(By.css("#pagingForm > div > a.btn.next")).click();
                await driver.sleep(2000);
                pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
                await driver.manage().setTimeouts(implicit_wait);
              } catch (error) {
                console.log("get out");
                break; 
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        console.log("✨ finished ✨");
        driver.quit();
      }

})();

var urlArr, href;

const getMovieJSON = async (listView, driver, i) => {
  try {
    let title = listView[i].findElement(By.css("td:nth-child(1) > span > a"));
    let mJson = {
        "movie_id": (await (listView[i].findElement(By.css("td:nth-child(3) > span"))).getText()).trim(),
        "title":  (await title.getText()).trim(),
        "eng_title": (await listView[i].findElement(By.css("td:nth-child(2) > span > a")).getText()).trim(),
        "production_year": (await listView[i].findElement(By.css("td:nth-child(4) > span")).getAttribute("title")).trim(),
        "production_country": (await listView[i].findElement(By.css("td:nth-child(5) > span")).getAttribute("title")).trim(),
        "size_type": (await listView[i].findElement(By.css("td:nth-child(6) > span")).getAttribute("title")).trim(),
        "genore": (await listView[i].findElement(By.css("td:nth-child(7) > span")).getAttribute("title")).trim(),
        "production_status": (await listView[i].findElement(By.css("td:nth-child(8) > span")).getAttribute("title")).trim(),
        "poster_img": null, "release_date": "", "updated_date": null, "memo": null,
        "director": (await listView[i].findElement(By.css("td:nth-child(9) > span")).getAttribute("title")).trim(),
        "actor": {}, "story": ""
    };
    await driver.manage().setTimeouts(implicit_wait);
    await title.click();
    await driver.sleep(2000);
    href = await (await driver.findElement(By.css(".item_tab.basic > div.ovf.info.info1 > a"))).getAttribute("href");
    urlArr = href.split("/"); 
    let imgLink = `${Date.now()}_${urlArr[urlArr.length-1]}`;
    if(urlArr[urlArr.length-1] == "searchMovieList.do#") { mJson.poster_img = "";} 
    else { mJson.poster_img = imgLink; }
    
    mJson.memo = (await driver.findElement(By.css(".item_tab.basic > div.ovf.info.info1 > dl > dd:nth-child(8)")).getText()).trim();
    mJson.updated_date = (await driver.findElement(By.css(".item_tab.basic > div.bar_top > div")).getText()).trim().split("최종수정: ")[1].split(" 수정요청")[0];
    await driver.manage().setTimeouts(implicit_wait);
    let dts = await driver.findElements(By.css(".item_tab.basic dl > *"));
    await driver.manage().setTimeouts(implicit_wait);
    let dtNum = 0;
    for(let dt of dts) {
      dtName = (await dt.getText()).trim();
      if(dtName == "개봉일") {
        mJson.release_date = (await dts[dtNum+1].getText());
        break;
      }
      dtNum++;
    };
    try {mJson.story = (await driver.findElement(By.css(".item_tab.basic  p.desc_info")).getText()).trim(); } 
    catch (error) {mJson.story = "";}
    // await console.log(mJson);
    return mJson;
  } catch (error) {
    console.log("movieJSON ERR - ", error);
    return {error: error}
  }
}

const pushMovieQuery = async (mJson) => {
  try {
    // 원래 있는 데이터 업데이트
    res = await dbQuery("GET", "SELECT * FROM movie WHERE movie_id = ?", [mJson.movie_id]);
    if(res.row.length > 0) {
      // console.log(res.row[0].updated_date, mJson.updated_date);
      if(res.row[0].updated_date != mJson.updated_date) {
        let sql =  "UPDATE `movie` SET `title`=?,`eng_title`=?,`production_year`=?,`production_country`=?,`size_type`=?,`genore`=?,`production_status`=?,`poster_img`=?,`release_date`=?,`updated_date`=?,`memo`=?,`director`=?,`actor`=?,`story`=? WHERE `movie_id`=?";
        let imgUrl;
        if(res.row[0].poster_img == "") imgUrl = mJson.poster_img;
        else imgUrl = res.row[0].poster_img;
        let params = [mJson.title, mJson.eng_title, mJson.production_year, mJson.production_country, mJson.size_type, mJson.genore,
          mJson.production_status, imgUrl, mJson.release_date, mJson.updated_date, mJson.memo,
          mJson.director, JSON.stringify(mJson.actor), mJson.story, mJson.movie_id];
        let queryRes = await dbQuery("UPDATE", sql, params);
        if(!queryRes.error) {
          if(urlArr[urlArr.length-1] != "searchMovieList.do#" && imgUrl == mJson.poster_img) {
            downloadImageToUrlInS3(href, mJson.poster_img);
          }
        }
        console.log(" updated => " + mJson.movie_id);
      } else { console.log("no updated => "+ mJson.movie_id);}
    } else {
      let sql = "INSERT INTO movie VALUES (?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?)";
      let params = [mJson.movie_id, mJson.title, mJson.eng_title, mJson.production_year, mJson.production_country,
        mJson.size_type, mJson.genore, mJson.production_status,mJson.poster_img, mJson.release_date,
        mJson.updated_date,mJson.memo,mJson.director,JSON.stringify(mJson.actor),mJson.story];
      let queryRes = await dbQuery("INSERT", sql, params);
      console.log(" inserted => " + mJson.movie_id);
      // console.log(queryRes);
      if(!queryRes.error) {
        if(urlArr[urlArr.length-1] != "searchMovieList.do#") {
          downloadImageToUrlInS3(href, mJson.poster_img);
        }
      }
    }
    
    // 
  } catch (error) {
      console.log("db ERR - ", error);
  }
}

const movieInfoByWebDriver = async (nowNum, i) => {
  const driver = await loadChromeDriver();
    // console.log(nowNum);
    try {
        await driver.get('https://www.kobis.or.kr/kobis/business/mast/mvie/searchMovieList.do');
        await driver.manage().setTimeouts(implicit_wait);
        await (driver.findElement(By.css(".slt_comm #sOrderBy > option:nth-child(4)"))).click();
        await driver.sleep(2000);
        while(true) {
          let pageBtns = await driver.findElements(By.css("#pagingForm > div > ul > li a"));
          await driver.manage().setTimeouts(implicit_wait);
          let idx = await findNumIdxInArrView(pageBtns, nowNum);
          if(idx >= 0) {
            await pageBtns[idx].click();
            await driver.sleep(2000);
            break;
          }
          let nextBtn = await driver.findElement(By.css("#pagingForm > div > a.btn.next"));
          await nextBtn.click();
          await driver.sleep(2000);
        }
        let mListView = await driver.findElements(By.css("#content > div.rst_sch > table > tbody > tr"));
        await driver.manage().setTimeouts(implicit_wait);
        let mJson = await getMovieJSON(mListView, driver, i);
        // console.log(mJson);
        if(!mJson.error) await pushMovieQuery(mJson);
        
    } catch (error) {
        console.log(error);
    } finally {
        try {
          await driver.close();
          await console.log("✨ one movie finished ✨");
          // 일반적으로 driver.close()브라우저를 닫고(드라이버 인스턴스는 그대로 driver.quit()유지됨) webdriver 인스턴스를 종료합니다.
        } catch (ter) {
          console.log(ter);
        }
        
      }
    
  };