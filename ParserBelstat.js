const puppeteer = require("puppeteer");
const axios = require("axios");
const xlsx = require("xlsx");


const mainUrl = 'https://www.belstat.gov.by/ofitsialnaya-statistika/realny-sector-ekonomiki/stoimost-rabochey-sily/operativnye-dannye/o-nachislennoy-sredney-zarabotnoy-plate-rabotnikov/'
const pensionInfoUrl = 'https://www.mintrud.gov.by/ru/informacia-o-srednih-razmerah-pensij-ru';

class ParserDataFormatter {
    getAverageSalary(string) {
        return parseInt(string.replace(',', '').split('').map((el, i) => string.charCodeAt(i) !== 160 ? el : '').join(''))
    }

    getMonthFullName(monthNum) {
        switch (monthNum) {
            case 1:
                return 'Январь'
            case 2:
                return 'Февраль'
            case 3:
                return 'Март'
            case 4:
                return 'Апрель'
            case 5:
                return 'Май'
            case 6:
                return 'Июнь'
            case 7:
                return 'Июль'
            case 8:
                return 'Август'
            case 9:
                return 'Сентябрь'
            case 10:
                return 'Октябрь'
            case 11:
                return 'Ноябрь'
            case 12:
                return 'Декабрь'
        }
    }

    getFileKeys() {
        return [
            'Номинальная начисленная и реальная заработная плата',
            'Номинальная начисленная и реальная заработная плата работников Республики Беларусь',
            '__EMPTY',
            '__EMPTY_1',
            '__EMPTY_2']
    }

    getSpeciality(speciality) {
        if (speciality.includes('/')) {
            return speciality.split('/')[0].includes('\r\n')
                ? speciality.split('/')[0].replaceAll('\r\n', ' ').toLowerCase().trim()
                : speciality.split('/')[0].toLowerCase().trim()
        } else {
            return speciality.includes('\r\n')
                ? speciality.replaceAll('\r\n', ' ').toLowerCase().trim()
                : speciality.toLowerCase().trim()
        }
    }

    getDataFromElement(element, keyIndex) {
        let elementData = {}
        const keys = this.getFileKeys();
        const excludeValues = ['Всего', 'Всего / Total'];
        const key = element[keys[keyIndex]];

        if (element.hasOwnProperty(keys[keyIndex]) && !excludeValues.includes(key)) {
            const valueKey = element.hasOwnProperty(keys[2]) ? keys[2] : keys[3]
            const value = typeof element[valueKey] === 'string'
                ? this.getAverageSalary(element[valueKey])
                : element[valueKey]

            // elementData = {
            //     speciality: this.getSpeciality(key),
            //     amount: value,
            //     currency: 'BYN'
            // }
            elementData = {
                [this.getSpeciality(key)]: value
            }
        }
        return Object.keys(elementData).length ? elementData : null
    }

    getDataFromExcel(fileName, excel) {
        if (!fileName && !excel) return null
        let fileJson = {
            name: fileName.name,
            year: fileName.year,
            month: fileName.month,
            monthName: fileName.monthName,
            specialities: []
        };
        if (excel && excel.length > 3)
            excel.slice(4,).map((elem) => {
                if (this.getDataFromElement(elem, 0)) fileJson.specialities.push(this.getDataFromElement(elem, 0))
                if (this.getDataFromElement(elem, 1)) fileJson.specialities.push(this.getDataFromElement(elem, 1))
            })
        return fileJson
    }

    getAveragePensionByMonths(dataArray) {
        let averagePension = {name: 'Средний размер пенсии по возрасту (для неработающего пенсионера)', data: []};
        const currentDate = new Date(Date.now())
        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        if (dataArray.length)
            dataArray.map(yearData => {
                const values = yearData.text.trim().split(/\s+/);
                const year = parseInt(values[0])
                months.map((month, index) =>
                    averagePension.data.push({
                        year: year,
                        month: index + 1,
                        monthName: this.getMonthFullName(index + 1),
                        amount: values[index + 1] ? parseInt(values[index + 1].replace(',', ''))/100 : null,
                        currency: 'BYN'
                    })
                )
            })
        averagePension.data = averagePension.data.filter(y => y.year >= currentDate.getFullYear() - 1)
            .filter(el => el.amount)
            .filter(el => el.year === currentDate.getFullYear() - 1 && el.month > currentDate.getMonth()
                || el.year === currentDate.getFullYear());
        return averagePension
    }
}


const dataFormatter = new ParserDataFormatter()


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
        if (pensionInfo && pensionInfo.length) return dataFormatter.getAveragePensionByMonths(pensionInfo.slice(3, 9))
    }

    async getAveragePensionLatestMonth() {
        const pensionInfo = await this.getAveragePensionAllAvailableMonths()
        if (pensionInfo && pensionInfo.data.length) return {
            name: pensionInfo.name,
            ... pensionInfo.data[pensionInfo.data.length - 1]
        }
    }
}

module.exports = new ParseBelStat(mainUrl, pensionInfoUrl)

