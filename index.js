const fs = require('fs');
const path = require('path');
const parserBelStat = require('./ParserBelstat');
const excelReader = require('./ExcelReader')
const dataFormatter = require('./DataFormatter')


function getData(file, excel) {
    const keys = dataFormatter.getFileKeys();
    const excludeValues = ['Всего', 'Всего / Total'];

    let fileJson = {};
    fileJson.name = dataFormatter.getAverageSalaryFileName(file)
    fileJson.speciality = []
    excel.slice(4,).map((elem) => {
        if(dataFormatter.getDataFromElement(elem, 0)) fileJson.speciality.push(dataFormatter.getDataFromElement(elem, 0))
        if(dataFormatter.getDataFromElement(elem, 1))fileJson.speciality.push(dataFormatter.getDataFromElement(elem, 1))
        //console.log(elem)
    })

    //console.log(fileJson)
    return fileJson
}




function getFiles() {
    const dir = fs.readdirSync(path.join(__dirname, 'downloads'))
    if (dir.length) {
        dir.map((file, i) => {
            const excel = excelReader.readExcel(file)
            const data = getData(file, excel)
            //fs.writeFile(path.join(__dirname, 'json', file.split('.')[0] + '.json'), JSON.stringify(data), ()=>{})
        })
    }
}

getFiles()
//parserBelStat.downloadAll().then(data=>data)
