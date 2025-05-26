const parserBelStat = require("./ParserBelstat");

async function getLatestData() {
    return {
        averageSalary: await parserBelStat.parseAverageSalaryLatestMonth(),
        averagePension: await parserBelStat.getAveragePensionLatestMonth(),
        averageSalaryByRegion: await parserBelStat.parseAverageSalaryByRegionLatestMonth()
    }
}

getLatestData().then(data=> console.log(data.averageSalary.specialities, data.averageSalaryByRegion.regions))
