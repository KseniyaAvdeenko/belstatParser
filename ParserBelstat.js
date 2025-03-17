const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const axios = require("axios");

const mainUrl = 'https://www.belstat.gov.by/ofitsialnaya-statistika/realny-sector-ekonomiki/stoimost-rabochey-sily/operativnye-dannye/o-nachislennoy-sredney-zarabotnoy-plate-rabotnikov/'
const pensionInfoUrl = 'https://www.mintrud.gov.by/ru/informacia-o-srednih-razmerah-pensij-ru'

class ParseBelStat {
    constructor(mainLink, pensionUrl) {
        this.mainLink = mainLink
        this.pensionUrl = pensionUrl
    }

    async getMonthsLinks() {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage()
            await page.goto(this.mainLink, {waitUntil: 'domcontentloaded',})
            await page.waitForSelector('div.catalogue')
            const links = await page.$$eval('div.catalogue > ul > li > a',
                anchors => anchors.map(a => a.href)
            )
            await browser.close()
            return links
        } catch (e) {
            console.log('Не удалось спарсить ссылки на страницы месяцев', e.message)
            return e.message
        }
    }

    async downloadExcelLink(link) {
        if (!link) return null
        const downloadPath = path.resolve(__dirname, 'downloads');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, {recursive: true});

        const fileName = link.split('/')[link.split('/').length - 1];
        const filePath = downloadPath + '\\' + fileName

        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        axios({
            method: 'GET',
            url: link,
            responseType: 'stream',
            httpsAgent: agent,
        })
            .then(response => {
                const fileStream = fs.createWriteStream(filePath);
                response.data.pipe(fileStream);

                fileStream.on('finish', () => {
                    console.log('Файл загружен:', filePath);
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки файла:', error.message);
            });

        return fileName
    }

    async getDownloadExcelLink(link) {
        const browser = await puppeteer.launch();
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage()
            await page.goto(link, {waitUntil: 'domcontentloaded'})
            await page.waitForSelector('div.l-main.default-content')
            return await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('div.l-main.default-content > a'));
                const targetLink = links.find(el => el.textContent.trim() ===
                    'Номинальная начисленная и реальная заработная плата работников Республики Беларусь по видам экономической деятельности (.xlsx)');
                return targetLink ? targetLink.href : null
            })
        } catch (e) {
            console.log('Не удалось найти ссылку на скачивания файла', e.message)
            return e.message
        } finally {
            await browser.close()
        }
    }

    async downloadAll() {
        const monthsLinks = await this.getMonthsLinks();
        for (let i = 0; i < monthsLinks.length; i++) {
            const link = await this.getDownloadExcelLink(monthsLinks[i])
            await this.downloadExcelLink(link);
        }
    }

    async parsePension() {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage()
            await page.goto(this.pensionUrl, {waitUntil: 'domcontentloaded',})
            await page.waitForSelector('tbody')
            const data = await page.$$eval('tbody > tr',
                rows => rows.map(row =>
                    [{text: row.textContent, index: row.rowIndex}]
                )
            )
            await browser.close()
            return data
        } catch (e) {
            console.log('Не удалось спарсить инфо о средней начисленной пенсии по возрасту', e.message)
            return e.message
        }
    }

}

module.exports = new ParseBelStat(mainUrl, pensionInfoUrl)