const fs = require('fs');
const { energyCommunityBeginning, coalClosuresBeginning, final, lowIncomeBeginning, MSA_NMSABeginning } = require('./constants')
const readline = require('readline');
const FILE_SIZE = 4000000;
const xmlFormat = require('xml-formatter');
const AdmZip = require('adm-zip');

function generateFile(pathFileToRead, beginning, pathFolderToWrite) {
    return new Promise(async (resolve, reject) => {
        let fileCont = 1
        const statesToGrab = ["Florida", "Illinois", "Massachusetts"]
        const tmpFolderPath = `${__dirname}/tmp`
        const writeFolderPath = `${pathFolderToWrite}`
        const lowIncomeStream = fs.createReadStream(pathFileToRead);
        const lowIncomeFile = readline.createInterface({
            input: lowIncomeStream,
            crlfDelay: Infinity
        });

        let content = "";
        const data = []
        let floridaPlacemarks = []
        let illinoisPlacemarks = []
        let massachusettsPlacemarks = []

        let currentState = ""
        let canRead = false
        let shouldWrite = false

        for await (let line of lowIncomeFile) {
            try {
                if (line.includes('<Placemark>')) {
                    canRead = true
                }
                if (canRead) {
                    content += line
                }
                if (line.toLocaleLowerCase().includes('<simpledata name="state_name">')) {
                    currentState = line.split('>')[1].split('<')[0]
                    if (!statesToGrab.includes(currentState)) shouldWrite = false;
                    else shouldWrite = true
                }

                if (line.includes('</Placemark>')) {
                    if (shouldWrite) {
                        switch (currentState) {
                            case "Florida":
                                floridaPlacemarks.push(content)
                                break
                            case "Illinois":
                                illinoisPlacemarks.push(content)
                                break
                            case "Massachusetts":
                                massachusettsPlacemarks.push(content)
                                break
                        }
                    }
                    content = ""
                }
            }
            catch (error) {
                console.log(error)
                debugger
                reject()
            }
        }
        resolve()
        const floridaFileContent = beginning + floridaPlacemarks.join("\n") + final
        const floridaXml = xmlFormat(floridaFileContent)
        fs.writeFileSync(`${tmpFolderPath}/florida.kml`, floridaXml);
        const floridaZip = new AdmZip();
        const floridaKmlData = fs.readFileSync(`${tmpFolderPath}/florida.kml`);
        floridaZip.addFile('doc.kml', floridaKmlData);
        floridaZip.writeZip(`${writeFolderPath}/florida.kmz`)
        // fs.unlinkSync(`${__dirname}/florida.kml`)

        const illinoisFileContent = beginning + illinoisPlacemarks.join("\n") + final
        const illinoisXml = xmlFormat(illinoisFileContent)
        fs.writeFileSync(`${tmpFolderPath}/illinois.kml`, illinoisXml);
        const illinoisZip = new AdmZip();
        const illinoisKmlData = fs.readFileSync(`${tmpFolderPath}/illinois.kml`);
        illinoisZip.addFile('doc.kml', illinoisKmlData);
        illinoisZip.writeZip(`${writeFolderPath}/illinois.kmz`)
        fs.unlinkSync(`${__dirname}/illinois.kml`)

        const massachusettsFileContent = beginning + massachusettsPlacemarks.join("\n") + final
        const massachusettsXml = xmlFormat(massachusettsFileContent)
        fs.writeFileSync(`${tmpFolderPath}/massachusetts.kml`, massachusettsXml);
        const massachusettsZip = new AdmZip();
        const massachusettsKmlData = fs.readFileSync(`${tmpFolderPath}/massachusetts.kml`);
        massachusettsZip.addFile('doc.kml', massachusettsKmlData);
        massachusettsZip.writeZip(`${writeFolderPath}/massachusetts.kmz`)
        fs.unlinkSync(`${__dirname}/massachusetts.kml`)
    })
}
function getFileSize(str) {
    return new Blob([str]).size;
}

async function main() {
    const pathToLowIncomeFile = `${__dirname}/Low-income.kml`;
    const pathToEnergyCommunityFile = `${__dirname}/Energy-community.kml`;
    const pathFolderToWriteLowIncome = `${__dirname}/low-income-files`;
    const pathFolderToWriteEnergyCommunity = `${__dirname}/energy-community-files`;
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    await Promise.all([
        // generateFile(pathToLowIncomeFile, lowIncomeBeginning, pathFolderToWriteLowIncome, 'low-income'),
        // generateFile(pathToEnergyCommunityFile, energyCommunityBeginning, pathFolderToWriteEnergyCommunity)
        generateFile(__dirname + "/data/CoalClosure.kml", coalClosuresBeginning, __dirname + "/CoalClosure"),
        generateFile(__dirname + "/data/MSA_NMSA.kml", MSA_NMSABeginning, __dirname + "/MSA_NMSA")
    ])
}

main();