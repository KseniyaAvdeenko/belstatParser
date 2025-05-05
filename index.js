const parserBelStat = require("./ParserBelstat");

async function getLatestData() {
    return {
        averageSalary: await parserBelStat.parseAverageSalaryLatestMonth(),
        pension: await parserBelStat.getAveragePensionLatestMonth()
    }
}


getLatestData().then(data=>console.log(data))