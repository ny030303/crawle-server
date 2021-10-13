const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson, appendLinkToTxt } = require('../fileController');
const { downloadImageToUrl } = require('../imgDownload');
const {dbQuery} = require("../../controllers/dbController");
exports.crawleMovieReview = async (driver, movie, mHref)  =>{
    try {
        await driver.get(mHref);
        console.log(movie, mHref);
        await driver.sleep(1000);
        try {
            // #paging_point li a ==> btn
            let actualYnLable1 = (await driver.findElement(By.css("#orderCheckbox > ul.quarter_mode > li:nth-child(1) .label_viewer:nth-child(2)")));
            await actualYnLable1.click();
            let actualYnLable2 = (await driver.findElement(By.css("#orderCheckbox > ul.quarter_mode > li:nth-child(2) .label_viewer:nth-child(2)")));
            await actualYnLable2.click();
            await driver.sleep(1000);

            let nextBtn;
            try {nextBtn = await driver.findElement(By.css(".pg_next"));} catch (error) {console.log("nextBtn is none");};
        
            if(nextBtn) {
                // bottom navigation's while
                while(nextBtn) {
                    try {
                        // console.log(await pageBtns[attempts].getText());
                        // await pageBtns[attempts].click();
                        // attempts += 1;
                        // await driver.sleep(1000);

                        // --review crawle--
                        let reviewListView = await driver.findElements(By.css("div.score_result > ul > li"));
                        // console.log(reviewListView);
                        for(let rev of reviewListView) {
                            let revJson = {
                                "movie_id": movie.movie_id,
                                "site": "naver",
                                "created": (await rev.findElement(By.css("div.score_reple > dl > dt > em:nth-child(2)")).getText()).trim().replace(/\./g, '-'),
                                "writer": (await  rev.findElement(By.css("div.score_reple > dl > dt > em:nth-child(1) > a > span")).getText()).trim(),
                                "comment": (await rev.findElement(By.css("div.score_reple > p > span:nth-child(2)")).getText()).trim(),
                                "like_num": Number((await rev.findElement(By.css("div.btn_area > a._sympathyButton strong")).getText()).trim()),
                                "rating_num": Number((await rev.findElement(By.css("div.star_score > em")).getText()).trim())
                            }
                            console.log(revJson);
                            try {
                                let sql =  "INSERT INTO movie_review VALUES (?,?,?, ?,?,?,?)";
                                let params = [revJson.movie_id, revJson.site, revJson.created, revJson.writer, revJson.comment, revJson.like_num, revJson.rating_num];
                                let queryRes = await dbQuery("INSERT", sql, params);
                                
                            } catch (error) {
                                console.log("이미 있거나 db 오류");
                            }
                        }

                        try {
                            nextBtn = await driver.findElement(By.css(".pg_next"));
                            await nextBtn.click();
                            await driver.sleep(500);
                        } catch (error) {
                            console.log("while 나가기");
                            break;
                        }
                    } catch (error) {
                        console.log(error);
                        console.log("nextBtn 새로고침");
                        nextBtn = await driver.findElement(By.css(".pg_next"));
                    }
                }
            };
        } catch (error) {
            console.log(error);
            console.log("해당 조건에 데이터가 존재하지 않음");
        }
    } catch(err) {
        console.log(err);
    }
}
