const parserBelStat = require("./ParserBelstat");

async function getLatestData() {
    return {
        averageSalary: await parserBelStat.parseAverageSalaryLatestMonth(),
        averagePension: await parserBelStat.getAveragePensionLatestMonth()
    }
}

getLatestData().then(data=> console.log(data))
