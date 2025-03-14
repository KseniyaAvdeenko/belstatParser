const fs = require('fs');
const path = require('path');
const xlsx = require("xlsx");

class ExcelReader {
    getFilePath(fileName) {
        const filePath = path.resolve(__dirname, 'downloads', fileName);
        if (!fs.existsSync(filePath)) {
            console.error('❌ Файл не найден:', filePath);
            process.exit(1);
        }
        return filePath
    }

    readExcel(fileName) {
        const workbook = xlsx.readFile(this.getFilePath(fileName));
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet)
        return Array.from(data);
    }
}

module.exports = new ExcelReader();