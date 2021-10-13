const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson } = require('./fileController');
const {init:dbInit,dbQuery} = require("../models");

(async function example() {
    // let driver = await new Builder().forBrowser('chrome').build();
    const chrome = require('selenium-webdriver/chrome');
    const chromedriver = require('chromedriver');

    chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    var driver = new Builder().withCapabilities(Capabilities.chrome()).build();

    try {
        await dbInit();
        let areaData = await getJsonData("area.json");
        let theaterData = await getJsonData("theater.json");

        // Navigate to Url
        await driver.get('http://www.cgv.co.kr/reserve/show-times/');

        let areaArr = await driver.findElements(By.css("#contents > div.sect-common > div > div.sect-city > ul > li > a"));
        
        for(let e of areaArr) {
            await e.click();
            await driver.sleep(1000);
            let theaterArr = await driver.findElements(By.css("#contents > div.sect-common > div > div.sect-city > ul > li.on > div > ul > li> a"));
            let areacode = [];
            for(let t of theaterArr) {
                let title = (await t.getAttribute("title")).trim();
                let href = (await t.getAttribute("href")).trim();
                
                let reqArr = href.split("?")[1].split("&");
                let addData = {};
                reqArr.forEach(v => {
                    let vKeys = v.split("=");
                    if(vKeys[0] == "areacode" && areacode[areacode.length-1] != vKeys[1]) areacode.push(vKeys[1]);
                    addData[vKeys[0]] = vKeys[1];
                });
                addData.title = title;
                let sql =  "INSERT INTO theater VALUES (?,?,?)";
                let params = [];
                for(let d of Object.keys(addData)) {
                    if(d != 'date') params.push(addData[d]);
                }
                console.log(params);
                let queryRes = await dbQuery("INSERT", sql, params);

                appendDataInJson(["theater.json", addData, theaterData], (res)=> {});
            };
            let area_title = (await e.getText()).trim();
            // console.log(area_title);
            let addData = {};
            areacode = areacode.join("|");
            addData.area_id = areacode; addData.title = area_title;
            let sql =  "INSERT INTO area VALUES (?,?)";
            let params = [addData.area_id, addData.title];
            let queryRes = await dbQuery("INSERT", sql, params);
            appendDataInJson(["area.json", addData, areaData], (res)=> {});
        }
        // console.log(areaArr);
        
    }
    finally{
        // driver.quit(); 
    }
})();
