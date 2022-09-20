class XERParser {
    constructor(fileUrl) {
        this.fileUrl = fileUrl;
        this.fileReader = new FileReader();
        this.byType = Object.create({});
        this.byId = Object.create({});
        this.readTextFile(this.fileUrl);
    }
    readTextFile(filePath) {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", filePath, true);
        rawFile.send(null);
        rawFile.onreadystatechange = () => {
            if (rawFile.readyState === 4) {
                if (rawFile.status === 200 || rawFile.status == 0) {
                    var allText = rawFile.responseText;
                    const lines = allText.split("\r\n");
                    let tableTitle;
                    let lineArrayKeys;
                    let lineArrayValues;
                    for (let line of lines) {
                        //Split lines to array elements
                        let splittedLine = line.split("\t");
                        if (splittedLine[0] === "%T") {
                            tableTitle = splittedLine[1].trim();
                            this.byType[tableTitle] = [];
                        }
                        else if (splittedLine[0] === "%F") {
                            //Add to array head names
                            lineArrayKeys = splittedLine.slice(1);
                        }
                        else if (splittedLine[0] === "%R") {
                            //Add to array lines
                            lineArrayValues = splittedLine.slice(1);
                            // Clean Object
                            let lineObj = Object.create({});
                            for (let j = 0; j < lineArrayKeys.length; j++) {
                                lineObj[lineArrayKeys[j]] = lineArrayValues[j];
                            }
                            this.byType[tableTitle].push(lineObj);
                            this.byId[lineArrayValues[0]] = lineObj;
                        }
                    }
                }
            }
        };
    }
    getActivities() {
        return this.byType["TASK"];
    }
}

const fileInput = document.getElementById("file");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const fileuRL = URL.createObjectURL(file);
  const parser = new XERParser(fileuRL);
  setTimeout(() => {
    console.log(parser.getActivities());
  }, 2000);
  console.log("ACTIVITIES", parser.getActivities());

  const reader = new FileReader();
  reader.onload = (event) => {
    console.log(reader.result);
  };
  reader.readAsText(file);
});
