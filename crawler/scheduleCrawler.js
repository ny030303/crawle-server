const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson } = require('./fileController');
const {init:dbInit,dbQuery} = require("../models");

const getLink = (codeName, a, t, d) => {
    return `http://www.cgv.co.kr/common/showtimes/iframeTheater.aspx?${codeName}=${a}&theatercode=${t}&date=${d}`;
}

(async function init() {
    
    const chrome = require('selenium-webdriver/chrome');
    const chromedriver = require('chromedriver');

    chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    var driver = new Builder().withCapabilities(Capabilities.chrome()).build();

    try {
        await dbInit();
        let nowDate = new Date().toISOString().split("-").join("").substr(0,6); // 2021-06-05... -> '202106'
        await driver.get(getLink("areacode", "01", "0056", "20210610"));
        
        let theaterArr = await getJsonData("theater.json"); // get -> theater.json
        let hallArr = await getJsonData("hall.json"); // get -> hall.json
        for(let v of theaterArr) {
            let dayViews = await driver.findElements(By.css(".day > a > strong"));
            let codeName = Object.keys(v)[0];
            let code = v.areacode || v.regioncode;
            
            // -make day list-
            let dayArr = [];
            for(let d of dayViews) {
                let date = (await d.getText()).trim();
                if(!date == true) {
                    (await driver.findElement(By.css("#slider > button.btn-next"))).click(); // click next
                    dayViews = await driver.findElements(By.css(".day > a > strong")); // reFind
                    date = (await d.getText()).trim(); // reFind text
                }
                let custumDate = nowDate + date + "";
                // console.log(codeName, code, v.theaterCode, custumDate);
                dayArr.push(custumDate);
            };
            console.log(dayArr);
            // -URL 접속-
            for(let d of dayArr) {
                await driver.get(getLink(codeName, code, v.theaterCode, d));
                await driver.sleep(1500);
                let movieViews = await driver.findElements(By.css(".col-times"));
                console.log(movieViews.length);
                for(let m of movieViews) {
                    let infoMovie = m.findElement(By.css(".info-movie > a"));
                    let movieUrl = await infoMovie.getAttribute("href"); // http://www.cg.../?midx=84595 
                    let movieIdx = movieUrl.split("?")[1].split("=")[1]; // -> 84595
                    // console.log(movieIdx ,", ", movieUrl);
                    let hallViews = await m.findElements(By.css(".type-hall"));
                    // console.log(hallViews);
                    for(let h of hallViews) {
                        let type = await h.findElement(By.css(".info-hall > ul > li:nth-child(1)")).getText();
                        let name = await h.findElement(By.css(".info-hall > ul > li:nth-child(2)")).getText();
                        let max_chair = await h.findElement(By.css(".info-hall > ul > li:nth-child(3)")).getText();
                        let screencode, playymd;
                        let hall = { "screencode": null, "playymd": null,"movie_id": movieIdx, "theater_id": v.theaterCode, "name": name,
                                    "max_chair": max_chair, "type": type, "time_table": []};
                        
                        let timetableList = await h.findElements(By.css(".info-timetable > ul li a"));
                        // console.log(timetableList.length);
                        // await driver.sleep(1500);
                        for(let tt of timetableList) {
                            screencode = await tt.getAttribute("data-screencode");
                            playymd = await tt.getAttribute("data-playymd");
                            let timeTable = {
                                "screencode":  screencode,
                                "playymd":  playymd,
                                "playstarttime":  await tt.getAttribute("data-playstarttime"),
                                "playendtime":  await tt.getAttribute("data-playendtime"),
                                "seatremaincnt":  Number(await tt.getAttribute("data-seatremaincnt")),
                            };
                            // console.log(timeTable);
                            hall.time_table.push(timeTable);
                            let sql = "INSERT INTO hall_time VALUES (?,?,?,?,?)";
                            let params = [timeTable.screencode, timeTable.playymd,timeTable.playstarttime,timeTable.playendtime,timeTable.seatremaincnt];
                            let queryRes = await dbQuery("INSERT", sql, params);
                            // console.log(queryRes);
                            await driver.sleep(10);
                        }
                        hall.screencode = screencode;
                        hall.playymd = playymd;
                        console.log(hall.screencode,hall.playymd);
                        let sql = "INSERT INTO hall VALUES (?,?,?,?, ?,?,?)";
                        let params = [hall.screencode, hall.playymd, hall.movie_id, hall.theater_id, hall.name, hall.max_chair, hall.type];
                        let queryRes = await dbQuery("INSERT", sql, params);
                        // console.log(queryRes);
                        appendDataInJson(["hall.json", hall, hallArr], (res)=> {});
                    }
                    
                }
                
            }
        };
    } catch(err) {
        console.log(err);
    }
    finally{
        // driver.quit(); 
    }
})();
