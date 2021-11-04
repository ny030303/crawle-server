const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { downloadImageToUrl,downloadImageToUrlInS3 } = require('../imgDownload');
const {init: dbInit, dbQuery, getTodayMovies} = require("../../controllers/dbController");
const {loadChromeDriver} = require("../../CommenUtil");
const { checkImagesExist } = require('../../cleanUpImages');

const implicit_wait = {implicit: 5000, pageLoad: 5000};


(movieInfoByWebDriver = async (nowNum, i) => {
    let driver;
    try {
        driver = await loadChromeDriver();
        let movieList = await checkImagesExist();
        // console.log(nowNum);
    
        await driver.get('https://www.kobis.or.kr/kobis/business/mast/mvie/searchUserMovCdList.do');
        await driver.manage().setTimeouts(implicit_wait);
        for(let mValue of movieList) {
            await driver.findElement(By.css('#searchForm > div.ins > div:nth-child(2) > div > input')).sendKeys(mValue.movie_id, Key.ENTER);
            await driver.manage().setTimeouts(implicit_wait);
            await driver.findElement(By.css('#searchForm > div.ins > div.wrap_btn > button')).click();
            await driver.manage().setTimeouts(implicit_wait);
            await driver.findElement(By.css('#content > div.rst_sch > table > tbody > tr > td:nth-child(1) > a')).click();
            await driver.manage().setTimeouts(implicit_wait);

            let href = await (await driver.findElement(By.css(".item_tab.basic > div.ovf.info.info1 > a"))).getAttribute("href");
            let urlArr = href.split("/");
            if(urlArr[urlArr.length-1] == "searchMovieList.do#") console.log("Can't found image");
            else downloadImageToUrl(href, mValue.poster_img);

            await driver.manage().setTimeouts(implicit_wait);
            await driver.get('https://www.kobis.or.kr/kobis/business/mast/mvie/searchUserMovCdList.do');
            await driver.manage().setTimeouts(implicit_wait);

        }
        
        
    } catch (error) {
        console.log(error);
    } finally {
        try {
            await driver.quit();
            await console.log("✨ one movie finished ✨");
            // 일반적으로 driver.close()브라우저를 닫고(드라이버 인스턴스는 그대로 driver.quit()유지됨) webdriver 인스턴스를 종료합니다.
        } catch (ter) {
            console.log(ter);
        }
        
    }
})();
