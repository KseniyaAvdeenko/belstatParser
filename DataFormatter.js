class DataFormatter {
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
                if (this.getDataFromElement(elem, 0)) fileJson.speciality.push(this.getDataFromElement(elem, 0))
                if (this.getDataFromElement(elem, 1)) fileJson.speciality.push(this.getDataFromElement(elem, 1))
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

module.exports = new DataFormatter()