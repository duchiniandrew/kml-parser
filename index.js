const fs = require('fs');
const { final } = require('./constants')
const readline = require('readline');
const FILE_SIZE = 4000000;
const xmlFormat = require('xml-formatter');
const AdmZip = require('adm-zip');

function generateFile(pathFileToRead, pathFolderToWrite, areaColor) {
    try {
        return new Promise(async (resolve, reject) => {
            let fileCont = 1
            const tmpFolderPath = `${__dirname}/tmp`
            const writeFolderPath = `${pathFolderToWrite}`
            const lowIncomeStream = fs.createReadStream(pathFileToRead);

            const lowIncomeFile = readline.createInterface({
                input: lowIncomeStream,
                crlfDelay: Infinity
            });

            let placemarkContent = "";
            let aux = ""
            let previousPlacemarkContent = "";
            let currentState = "";
            let fileBeginning = ""
            let gotBeginning = false

            for await (let line of lowIncomeFile) {
                try {
                    if (!gotBeginning && line.includes('<Placemark>')) {
                        gotBeginning = true
                    }
                    if(areaColor && line.includes('<Placemark>')) {
                        line += `\n<Style><LineStyle><color>${areaColor}</color></LineStyle><PolyStyle><color>${areaColor}</color><fill>1</fill></PolyStyle></Style>\n`
                    }
                    if(line.includes('<Style><LineStyle><color>ff0000ff</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>')) {
                        line = line.replace('<Style><LineStyle><color>ff0000ff</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>', 
                            `<Style><LineStyle><color>${areaColor}</color></LineStyle><PolyStyle><color>${areaColor}</color><fill>1</fill></PolyStyle></Style>`);
                    }
                    if (!gotBeginning) {
                        fileBeginning += line
                    } else {
                        placemarkContent += line
                    }
                    aux += line
                    if (line.toLowerCase().includes('<simpledata name="state_name">') || line.toLowerCase().includes('<simpledata name="statename">')) {
                        const state = line.split('>')[1].split('<')[0]
                        if (!currentState) currentState = state
                        if (state !== currentState) {
                            const zip = new AdmZip();
                            const fileContent = fileBeginning + previousPlacemarkContent + final
                            const result = xmlFormat(fileContent)
                            fs.writeFileSync(`${tmpFolderPath}/${currentState}.kml`, result);
                            const kmlData = fs.readFileSync(`${tmpFolderPath}/${currentState}.kml`);
                            zip.addFile('doc.kml', kmlData);
                            zip.writeZip(`${writeFolderPath}/${currentState}.kmz`)
                            // fs.unlinkSync(`${tmpFolderPath}/${currentState}.kml`)
                            currentState = state
                            placemarkContent = aux
                        }
                    }
                    if (line.includes('</Placemark>')) {
                        previousPlacemarkContent = placemarkContent
                        aux = ""
                    }
                }
                catch (error) {
                    console.log(error)
                    debugger
                    reject()
                }
            }
            resolve()
        })
    }
    catch (error) {
        console.log(error)
        debugger
    }
}

async function main() {
    const pathToLowIncomeCategory1 = `${__dirname}/data/Low-Income-category-1.kml`;
    const pathToLowIncomePPC = `${__dirname}/data/Low-Income-PPC.kml`;
    const pathToLowIncomeCEJSTFile = `${__dirname}/data/Low-Income-CEJST.kml`;
    const pathToCoalClosure = `${__dirname}/data/CoalClosure.kml`;
    const pathToMSANMSA = `${__dirname}/data/MSA-EC.kml`;

    const pathFolderToWriteLowIncomeCategory1 = `${__dirname}/lowIncomeCategory1`;
    const pathFolderToWriteLowIncomePPC = `${__dirname}/lowIncomePPC`;
    const pathFolderToWriteLowIncomeCEJST = `${__dirname}/lowIncomeCEJST`;
    const pathFolderToWriteMSA = `${__dirname}/MSA_NMSA`;
    const pathFolderToWriteCoalClosures = `${__dirname}/CoalClosure`;
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

    await Promise.all([
        generateFile(pathToCoalClosure, pathFolderToWriteCoalClosures, "6600ff00")
        // generateFile(pathToLowIncomeCategory1, pathFolderToWriteLowIncomeCategory1, "66d93c39")
        // generateFile(pathToLowIncomePPC, pathFolderToWriteLowIncomePPC, "66a9e338"),
        // generateFile(pathToLowIncomeCEJSTFile, pathFolderToWriteLowIncomeCEJST, "66cd1c4d"),
        // generateFile(pathToMSANMSA, pathFolderToWriteMSA, "668c46ee"),
    ])
}

main();