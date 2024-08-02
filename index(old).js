const fs = require('fs');
const readline = require('readline');
const FILE_SIZE = 4000000;
const xmlFormat = require('xml-formatter');
const AdmZip = require('adm-zip');
let fileCont = 1

async function processLineByLine() {
    const final = `
    			</Folder>
	</Document>
</kml>
    `
    const fileStream = fs.createReadStream(`./tmp/Pennsylvania.kml`);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let placemarkContent = "";
    let fileBeginning = ""
    let gotBeginning = false

    for await (let line of rl) {
        try {
            if (!gotBeginning && line.includes('<Placemark>')) {
                gotBeginning = true
            }
            if (!gotBeginning) {
                fileBeginning += line
            } else {
                placemarkContent += line
            }
            if (line.includes('</Placemark>')) {
                const fileSize = getFileSize(placemarkContent)
                if (fileSize >= FILE_SIZE) {
                    const fileContent = fileBeginning + placemarkContent + final
                    const result = xmlFormat(fileContent)
                    fs.writeFileSync(`${__dirname}/Pennsylvania-${fileCont}.kml`, result);
                    const zip = new AdmZip();
                    const kmlData = fs.readFileSync(`${__dirname}/Pennsylvania-${fileCont}.kml`);
                    zip.addFile('doc.kml', kmlData);
                    zip.writeZip(`${__dirname}/CoalClosure/Pennsylvania-${fileCont}.kmz`)
                    // fs.unlinkSync(`${__dirname}/energy-community-${fileCont}.kml`)
                    fileCont++
                    placemarkContent = ""
                }
            }
        }
        catch (error) {
            console.log(error)
            debugger
        }
    }
}

function getFileSize(str) {
    return new Blob([str]).size;
}

processLineByLine();