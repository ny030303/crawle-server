const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson, appendLinkToTxt } = require('../../fileController');
const { downloadImageToUrl } = require('../../imgDownload');
const {init:dbInit,dbQuery} = require("../../../models");
const {crawleMovieReview} = require("./crawleReview");

(async function init() {
    const chrome = require('selenium-webdriver/chrome');
    const chromedriver = require('chromedriver');

    chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    var driver = new Builder().withCapabilities(Capabilities.chrome()).build();

    // var driver = new Builder().withCapabilities(Capabilities.chrome()).setChromeOptions(new chrome.Options().headless()).build();
    // SELECT * FROM `movie` where release_date NOT LIKE '____-__-__' <<=  release_date를 알 수 없는 정보 (나중에 처리 필요)
    try {
        await dbInit();
        let sql = "SELECT * FROM movie where production_status = '개봉' AND movie_id NOT IN " +
         "(SELECT a.movie_id FROM `movie` a, `movie_score` b where a.movie_id = b.movie_id AND DATE_FORMAT(now(), '%Y-%m-%d') = left(b.created, 10) order by b.reservation_rate desc)"; 
        let queryRes = await dbQuery("GET", sql, []);
        for(let movie of queryRes.row) {
            await driver.get("https://pedia.watcha.com/ko-KR/searches/movies?query="+ movie.title);
            await driver.sleep(500);
            // title, release_date, eng_title(선택)
            try {
                let noresultView, bottomView = null;
                try {
                    // noresult section 찾으면
                    noresultView = await driver.findElement(By.css(".css-1qytvfb-Message"));
                    console.log("해당 조건에 데이터가 존재하지 않음");
                } 
                catch (err) {
                    let isFind = false;
                    while(!isFind) {
                        try { 
                           // --find movie--
                           let isBreakWhile = await findMovieInBoxList(driver, movie);
                           if(isBreakWhile) {
                                isFind = true;
                                console.log("찾았으니 while 나가기");
                                break;
                           }
                            
                           try {
                            let beforeList = await driver.findElements(By.css("#root > div > div > section > section > div > div > div > ul li"));
                            await driver.executeAsyncScript("window.scrollTo(0, document.body.scrollHeight);");
                            await driver.sleep(500);
                            let afterList = await driver.findElements(By.css("#root > div > div > section > section > div > div > div > ul li"));
                            if(beforeList.length == afterList.length) {
                                console.log("없음. while 나가기");
                                isFind = true;
                                break;
                            }

                            } catch (error) {
                                console.log("while 나가기");
                                break;
                            }
                        } catch (error) {
                            console.log("새로고침");
                            // nextBtn = await driver.findElement(By.css("#old_content > div.pagenavigation > table > tbody > tr > td.next"));
                        }
                    };
                };
            } catch (error) {
                console.log(error);
                console.log("해당 조건에 데이터가 존재하지 않음");
            }
            
        }
        
    } catch(err) {
        console.log(err);
    }
    finally{
        console.log("✨ finished ✨");
        await driver.quit(); 
    }
})();


async function findMovieInBoxList(driver, movie) {
    let res = false;
    let movieBoxesView = await driver.findElements(By.css("#root > div > div > section > section > div > div > div > ul li"));
    for(let box of movieBoxesView) {
        try {
            let b_title = (await box.findElement(By.css("a > div > div > div:first-child")).getText()).trim();
            // let b_release_date = (await box.findElement(By.css("dl > dd:nth-child(3) > a:nth-child(8)")).getText()).trim();
            // console.log("b_title: ", b_title, " b_release_date: ", b_release_date);
            if(movie.title == b_title) {
                console.log("movie 찾음");
                res = true;
                let mHref = (await box.findElement(By.css("a")).getAttribute("href"));
                // console.log(mHref);
                let mId = mHref.split("contents/")[1];
                console.log(mId);
                await crawleMovieReview(driver, movie, "https://pedia.watcha.com/ko-KR/contents/" + mId + "/comments");
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