class DataFormatter {
    getAverageSalary(string) {
        return parseInt(string.replace(',', '').split('').map((el, i) => string.charCodeAt(i) !== 160 ? el : '').join(''))
    }

    getFullDate(file) {
        const date = file.split('.')[0].split('-')[1];
        return new Date('20' + date.slice(0, 2) + "-" + date.slice(2,))
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
        const fullDate = this.getFullDate(file)
        const year = fullDate.getFullYear()
        const month = this.getMonthFullName(fullDate.getMonth())
        const heading = 'Номинальная начисленная средняя заработная плата Республики Беларусь по видам экономической деятельности за'
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

    getSpeciality(speciality) {
        if (speciality.includes('/')) return speciality.split('/')[0].includes('\r\n')
            ? speciality.split('/')[0].replaceAll('\r\n', ' ')
            : speciality.split('/')[0]
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

            elementData = {
                speciality: this.getSpeciality(key),
                amount: value,
                currency: 'BYN'
            }
        }
        return Object.keys(elementData).length ? elementData : null
    }

    getDataFromExcel(file, excel) {
        let fileJson = {
            name: this.getAverageSalaryFileName(file),
            year: this.getFullDate(file).getFullYear(),
            month: this.getFullDate(file).getMonth() + 1,
            speciality: []
        };
        excel.slice(4,).map((elem) => {
            if (this.getDataFromElement(elem, 0)) fileJson.speciality.push(this.getDataFromElement(elem, 0))
            if (this.getDataFromElement(elem, 1)) fileJson.speciality.push(this.getDataFromElement(elem, 1))
        })
        return fileJson
    }

    getAveragePensionByMonths(dataArray) {
        let averagePension = {name: 'Средний размер пенсии по возрасту (для неработающего пенсионера)', data: []};
        const currentDate = new Date(Date.now())
        const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
        let data = []
        if (dataArray.length)
            dataArray.map(yearData => {
                const values = yearData.text.trim().split(/\s+/);
                const year = parseInt(values[0])
                months.map((month, index) =>
                    averagePension.data.push({
                        year: year,
                        month: index,
                        amount: values[index + 1] ? parseInt(values[index + 1].replace(',', '')) : null,
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

module.exports = new DataFormatter()