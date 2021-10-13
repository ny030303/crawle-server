const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { downloadImageToUrl } = require('../imgDownload');
const {init:dbInit,dbQuery} = require("../../controllers/dbController");
const {loadChromeDriver} = require("../../CommenUtil");
// ()();

exports.crawleReservationRate = async function () {
    
  const driver = await loadChromeDriver();
  try {
        // let driver = await new Builder().forBrowser('chrome').build();
        
        await dbInit();
        // Navigate to Url
        await driver.get('https://www.kobis.or.kr/kobis/business/stat/boxs/findRealTicketList.do');
        await driver.sleep(1000);

        let listView = await driver.findElements(By.css("#tr_"));
        for(let tr of listView) {
            let trJson = {
                "movie_id": (await tr.findElement(By.css("td:nth-child(2) > span > a")).getAttribute("onclick")).split("'")[3],
                "site": "kofic",
                "created": (await driver.findElement(By.css("#content > div.rst_sch > div.hd_rst > span:nth-child(2) > em > b")).getText()).trim().split(" : ")[1].replace(/\//g, '-'),
                "reservation_rate": Number((await tr.findElement(By.css("td:nth-child(4)")).getText()).trim().split("%")[0]),
                "sales": Number((await tr.findElement(By.css("td:nth-child(5)")).getText()).trim().replace(/\,/g, '')),
                "audience_count": Number((await tr.findElement(By.css("td:nth-child(7)")).getText()).trim().replace(/\,/g, ''))
            }
            // console.log(trJson);
            let sql =  "SELECT * FROM movie_score WHERE movie_id = ?";
            res = await dbQuery("GET", "SELECT * FROM movie_score WHERE movie_id = ?", [trJson.movie_id]);
            // console.log(res.row);
            if(res.row.length > 0) {
                let sql =  "UPDATE movie_score SET `created`=?,`reservation_rate`=?,`sales`=?,`audience_count`=? WHERE movie_id = ?";
                let params = [trJson.created, trJson.reservation_rate, trJson.sales, trJson.audience_count, trJson.movie_id];
                let queryRes = await dbQuery("UPDATE", sql, params);
            } else {
                let sql =  "INSERT INTO movie_score VALUES (?,?,?, ?,?,?)";
                let params = [trJson.movie_id, trJson.site, trJson.created, trJson.reservation_rate, trJson.sales, trJson.audience_count];
                let queryRes = await dbQuery("INSERT", sql, params);
            }
            // await driver.sleep(1000);
        };
        //
    }
    catch(err) {
        console.log(err);
    }
    finally{
        await driver.quit(); 
        await console.log("✨ Reservation rate Reloaded ✨");
    }
}


