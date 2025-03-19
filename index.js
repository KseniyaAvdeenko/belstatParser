const parserBelStat = require("./ParserBelstat");
const dataFormatter = require("./DataFormatter");
const {getFiles} = require("./getFiles");
const {CronJob} = require('cron');
const fs = require('fs')
const path = require("path");

async function getAveragePensionAll() {
    const pensionInfo = await parserBelStat.parsePension()
    if (pensionInfo && pensionInfo.length) {
        const data = dataFormatter.getAveragePensionByMonths(pensionInfo.slice(3, 9))
        // fs.writeFile(
        //             path.join(__dirname, 'json',
        //                 `average_pension.json`),
        //             JSON.stringify(data), () => {
        //             })
        return data
    }
}

async function getAveragePensionLatest() {
    const pensionInfo = await parserBelStat.parsePension()
    const currentDate = new Date(Date.now())
    if (pensionInfo && pensionInfo.length) {
        const data = dataFormatter.getAveragePensionByMonths(pensionInfo.slice(3, 9))
        return {name: data.name, data: data.data.filter(el=> el.year === currentDate.getFullYear() && el.month === currentDate.getMonth())}
    }
}
async function getAverageDataAll() {
    await getAveragePensionAll()
    await parserBelStat.downloadAll();
    getFiles()
}

async function getAverageDataLatest() {

    await parserBelStat.downloadLatest();
    getFiles()
}

//задача сработает один раз
setTimeout(getAverageDataAll, 10 * 1000);
setTimeout(getAveragePensionAll, 10 * 1000);

const getAverageDataMonthlyJob = new CronJob('0 10 1 * *', async () => {
    await getAverageDataLatest()
    await getAveragePensionLatest()
})

getAverageDataMonthlyJob.start();

