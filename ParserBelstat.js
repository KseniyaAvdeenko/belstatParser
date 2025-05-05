const puppeteer = require("puppeteer");
const axios = require("axios");
const xlsx = require("xlsx");
const dataFormatter = require('./DataFormatter')

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

    async readExcelData(fileUrl) {
        try {
            const response = await axios.get(fileUrl, {responseType: 'arraybuffer'});
            const workbook = xlsx.read(response.data, {type: 'buffer'});
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet)
            return Array.from(data)
        } catch (e) {
            console.warn('cannot read data')
            return null
        }
    }

    getFileName(link) {
        if (!link) return null
        const date = link.split('/')[link.split('/').length - 1].split('.')[0].split('-')[1]
        return {
            name: 'Номинальная начисленная и реальная заработная плата работников Республики Беларусь по видам экономической деятельности',
            year: Number(20 + date.slice(0, 2)),
            month: Number(date.slice(2,)),
            monthName: dataFormatter.getMonthFullName(Number(date.slice(2,)))
        }
    }

    async getExcelLink(link) {
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

    async parseAverageSalaryAllAvailableMonths() {
        const monthsLinks = await this.getMonthsLinks();
        let result = [];
        for (let i = 0; i < monthsLinks.length; i++) {
            const link = await this.getExcelLink(monthsLinks[i])
            const fileName = this.getFileName(link)
            const data = await this.readExcelData(link);
            if (data) result.push(dataFormatter.getDataFromExcel(fileName, data))
        }
        return result;
    }

    async getLatestMonth() {
        const monthsLinks = await this.getMonthsLinks()
        return monthsLinks.length ? monthsLinks[0] : null
    }

    async parseAverageSalaryLatestMonth() {
        const latestMonth = await this.getLatestMonth()
        if (!latestMonth) throw new Error('Нет ссылки')
        const link = await this.getExcelLink(latestMonth)
        const fileName = this.getFileName(link)
        const data = await this.readExcelData(link);
        if (data) return dataFormatter.getDataFromExcel(fileName, data)
    }

    async parsePension() {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage()
            await page.goto(this.pensionUrl, {waitUntil: 'domcontentloaded',})
            await page.waitForSelector('tbody')
            const data = await page.$$eval('tbody > tr',
                rows => rows.map(row =>
                    ({text: row.textContent, index: row.rowIndex})
                )
            )
            await browser.close()
            return data
        } catch (e) {
            console.log('Не удалось спарсить инфо о средней начисленной пенсии по возрасту', e.message)
            return null
        }
    }

    async getAveragePensionAllAvailableMonths() {
        const pensionInfo = await this.parsePension()
        if (pensionInfo && pensionInfo.length) {
            return dataFormatter.getAveragePensionByMonths(pensionInfo.slice(3, 9))
        }
    }

    async getAveragePensionLatestMonth() {
        const pensionInfo = await this.parsePension()
        const currentDate = new Date(Date.now())
        if (pensionInfo && pensionInfo.length) {
            const data = dataFormatter.getAveragePensionByMonths(pensionInfo.slice(3, 9))
            return {
                name: data.name,
                data: data.data.filter(el => el.year === currentDate.getFullYear() && el.month === currentDate.getMonth())
            }
        }
    }
}

module.exports = new ParseBelStat(mainUrl, pensionInfoUrl)

