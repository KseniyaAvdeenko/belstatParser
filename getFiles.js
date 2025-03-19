const dataFormatter = require("./DataFormatter");
const path = require("path");
const fs = require("fs");
const excelReader = require('./ExcelReader')

function getFiles() {
    const dir = fs.readdirSync(path.join(__dirname, 'downloads'))
    if (dir.length) {
        dir.map(file => {
            const excel = excelReader.readExcel(file)
            const data = dataFormatter.getDataFromExcel(file, excel)
            // fs.writeFile(
            //             path.join(__dirname, 'json',
            //                 `${file}.json`),
            //             JSON.stringify(data), () => {
            //             })

            //или сохраняется в бд

            // удаление файла после чтения и записи в бд
            // fs.unlink(path.join(__dirname, 'downloads', file), (err) => {
            //     if (err) throw err;
            // });
        })
    }
}

module.exports = {getFiles};