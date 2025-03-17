const fs = require('fs');
const path = require('path');
const parserBelStat = require('./ParserBelstat');
const excelReader = require('./ExcelReader')
const dataFormatter = require('./DataFormatter')


async function getAveragePension(){
    const pensionInfo = await parserBelStat.parsePension()
    const data = dataFormatter.getAveragePensionByMonths(pensionInfo.slice(0, 9))
    // fs.writeFile(
    //             path.join(__dirname, 'json',
    //                 `average_pension.json`),
    //             JSON.stringify(data), () => {
    //             })
    return data
}

function getFiles() {
    const dir = fs.readdirSync(path.join(__dirname, 'downloads'))
    if (dir.length) {
        dir.map(file => {
            const excel = excelReader.readExcel(file)
            const data = dataFormatter.getDataFromExcel(file, excel)
            // fs.writeFile(
            //     path.join(__dirname, 'json',
            //         `average_salary_${dataFormatter.getFullDate(file).toISOString().slice(0, 7)}.json`),
            //     JSON.stringify(data), () => {
            //     })
        })
    }
}

getAveragePension()

//parserBelStat.downloadAll().then(data=>data)
//getFiles()