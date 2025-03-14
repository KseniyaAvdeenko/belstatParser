const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const axios = require("axios");

const mainUrl = 'https://www.belstat.gov.by/ofitsialnaya-statistika/realny-sector-ekonomiki/stoimost-rabochey-sily/operativnye-dannye/o-nachislennoy-sredney-zarabotnoy-plate-rabotnikov/'

class ParseBelStat {
    constructor(mainLink) {
        this.mainLink = mainLink
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

    async getLatestMonthLink(array) {
        if (array.length) return array[0]
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
        let files = [];
        const monthsLinks = await this.getMonthsLinks();
        for (let i = 0; i < monthsLinks.length; i++) {
            const link = await this.getDownloadExcelLink(monthsLinks[i])
            const file = await this.downloadExcelLink(link);
            files.push(file)
        }
        return files
    }

    async downloadLatestMonth() {
        const monthsLinks = await this.getMonthsLinks();
        const latestMonth = await this.getLatestMonthLink(monthsLinks)
        const link = await this.getDownloadExcelLink(latestMonth)
        await this.downloadLink(link)
    }
}

module.exports = new ParseBelStat(mainUrl)