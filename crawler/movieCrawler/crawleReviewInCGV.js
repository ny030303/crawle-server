const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson, appendLinkToTxt } = require('../fileController');
const { downloadImageToUrl } = require('../imgDownload');
const {dbQuery} = require("../../controllers/dbController");
exports.crawleMovieReview = async (driver, movie, mHref)  =>{
    try {
        await driver.get(mHref);
        console.log(movie, mHref);
        
        try {
            // #paging_point li a ==> btn
            let pageBtns = await driver.findElements(By.css("#paging_point li > a"));
            let attempts = 0;

            while(attempts < pageBtns.length) {
                try {
                    console.log(await pageBtns[attempts].getText());
                    await pageBtns[attempts].click();
                    attempts += 1;
                    await driver.sleep(1000);
                    // --review crawle--
                    let reviewListView = await driver.findElements(By.css("#movie_point_list_container > li"));
                    // console.log(reviewListView);
                    for(let rev of reviewListView) {
                        let revJson = {
                            "movie_id": movie.movie_id,
                            "site": "cgv",
                            "created": (await rev.findElement(By.css(".writer-etc > span.day")).getText()).trim().replace(/\./g, '-'),
                            "writer": (await  rev.findElement(By.css(".writer-name > a")).getText()).trim(),
                            "comment": (await rev.findElement(By.css(".box-comment > p")).getText()).trim(),
                            "like_num": Number((await rev.findElement(By.css(".btn_point_like #idLikeValue")).getText()).trim())
                        }
                        console.log(revJson);
                        try {
                            let sql =  "INSERT INTO movie_review VALUES (?,?,?, ?,?,?,?)";
                            let params = [revJson.movie_id, revJson.site, revJson.created, revJson.writer, revJson.comment, revJson.like_num, -1];
                            let queryRes = await dbQuery("INSERT", sql, params);
                        } catch (error) {
                            console.log("이미 있거나 db 오류");
                        }
                        
                    }
                    if(attempts >= pageBtns.length) {
                        try {
                            let nextBtn = await driver.findElement(By.css(".btn-paging.next"));
                            nextBtn.click();
                            attempts = 0;
                        } catch (error) {
                            console.log("while 나가기");
                            break;
                        }
                    }
                } catch (error) {
                    console.log(error);
                    console.log("pageBtns 새로고침");
                    pageBtns = await driver.findElements(By.css("#paging_point li > a"));
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
