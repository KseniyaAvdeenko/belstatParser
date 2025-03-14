class DataFormatter {
    getAverageSalary(string) {
        //return parseFloat(string.replace(',', '.').split('').map((el, i) => string.charCodeAt(i) !== 160 ? el : '').join(''))
        return string.split('').map((el, i) => string.charCodeAt(i) !== 160 ? el : ' ').join('')
    }

    getFullDate(year, month) {
        return new Date(year + "-" + month)
    }

    getMonthFullName(monthNum) {
        switch (monthNum) {
            case 0:
                return 'Январь'
            case 1:
                return 'Февраль'
            case 2:
                return 'Март'
            case 3:
                return 'Апрель'
            case 4:
                return 'Май'
            case 5:
                return 'Июнь'
            case 6:
                return 'Июль'
            case 7:
                return 'Август'
            case 8:
                return 'Сентябрь'
            case 9:
                return 'Октябрь'
            case 10:
                return 'Ноябрь'
            case 11:
                return 'Декабрь'
        }
    }

    getAverageSalaryFileName(file) {
        const date = file.split('.')[0].split('-')[1];
        const fullDate = this.getFullDate('20' + date.slice(0, 2), date.slice(2,))
        const year = fullDate.getFullYear()
        const month = this.getMonthFullName(fullDate.getMonth())
        const heading = 'Номинальная начисленная и реальная заработная плата работников Республики Беларусь по видам экономической деятельности за'
        return `${heading} ${month} ${year}`
    }

    getFileKeys() {
        return [
            'Номинальная начисленная и реальная заработная плата',
            'Номинальная начисленная и реальная заработная плата работников Республики Беларусь',
            '__EMPTY',
            '__EMPTY_1',
            '__EMPTY_2']
    }

    getDataFromElement(element, keyIndex) {
        let elementData = {}
        const keys = this.getFileKeys();
        const excludeValues = ['Всего', 'Всего / Total'];
        const key = element[keys[keyIndex]];

        if (element.hasOwnProperty(keys[keyIndex]) && !excludeValues.includes(key)) {
            const valueKey = element.hasOwnProperty(keys[2]) ? keys[2] : keys[3]
            const value = typeof element[valueKey] === 'string'
                ? this.getAverageSalary(element[valueKey]) + ' BYN'
                : element[valueKey] + ' BYN'

            elementData = {
                speciality: key.includes('\r\n') ? key.replaceAll('\r\n', ' ') : key,
                averageSalary: value
            }
        }

        return Object.keys(elementData).length ? elementData : null
    }
}

module.exports = new DataFormatter()