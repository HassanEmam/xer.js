import { GanttChart } from "4d-gantt-chart";
import { XERParser } from "xer.js";

const fileInput = document.getElementById("file");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const parser = new XERParser(file);
  setTimeout(async () => {
    const scheduleData = parser.getWBS();
    console.log("schedule Data", scheduleData);
    let container = document.getElementById("ganttChart");
    container.innerHTML = "";
    let options = {
      container: container,
      showBaseline: false,
      dataDate: new Date(2021, 5, 15),
      gridScale: 5,
      gridColor: "black",
      data: scheduleData,
      titleOptions: "Music",
      rowHeight: 30,
      timeLineColumnWidth: 30,
      timeLineBackgroundColor: "rgb(245, 245, 245)",
      timeLineHeight: 120,
      tableWidth: 400,
      table: {
        width: 400,
      },
      barColor: "lightgreen",
      barColorHover: "red",
      colors: ["#a55ca5", "#67b6c7", "#bccd7a", "#eb9743"],
    };
    let gantt = new GanttChart(options);
    gantt.draw();

    gantt.on("taskClicked", (task) => {
      createCodesTable(task, parser);
      createPredecessorsTable(task, parser);
      createResourceTable(task, parser);
    });
  }, 100);

  const reader = new FileReader();
  reader.onload = (event) => {
    // console.log(reader.result);
  };
  reader.readAsText(file);
});

function createCodesTable(task, parser) {
  const codeDiv = document.getElementById("Codes");
  codeDiv.innerHTML = "";
  const codesTable = document.createElement("table");
  const codesTableHead = document.createElement("thead");
  const codesTableBody = document.createElement("tbody");
  const codesTableHeadRow = document.createElement("tr");
  const codesTableHeadRowCode = document.createElement("th");
  const codesTableHeadRowType = document.createElement("th");
  codesTableHeadRowType.innerHTML = "Type";
  codesTableHeadRowCode.innerHTML = "Code";
  codesTableHeadRow.appendChild(codesTableHeadRowCode);
  codesTableHeadRow.appendChild(codesTableHeadRowType);
  codesTableHead.appendChild(codesTableHeadRow);
  codesTable.appendChild(codesTableHead);
  codesTable.appendChild(codesTableBody);
  parser.getActivityCodes(task.id).forEach((code) => {
    const div = document.createElement("div");
    const row = document.createElement("tr");
    const codeCell = document.createElement("td");
    const typeCell = document.createElement("td");
    typeCell.innerHTML = code.type;
    codeCell.innerHTML = code.code;
    row.appendChild(codeCell);
    row.appendChild(typeCell);
    codesTableBody.appendChild(row);
  });
  codeDiv.appendChild(codesTable);
}

function createPredecessorsTable(task, parser) {
  const predDiv = document.getElementById("predecessors");
  predDiv.innerHTML = "";
  const predTable = document.createElement("table");
  const predTableHead = document.createElement("thead");
  const predTableBody = document.createElement("tbody");
  const predTableHeadRow = document.createElement("tr");
  const predTableHeadRowCode = document.createElement("th");
  const predTableHeadRowName = document.createElement("th");
  const predTableHeadRowType = document.createElement("th");
  const predTableHeadRowLag = document.createElement("th");
  predTableHeadRowCode.innerHTML = "Code";
  predTableHeadRowName.innerHTML = "Name";
  predTableHeadRowType.innerHTML = "Type";
  predTableHeadRowLag.innerHTML = "Lag";
  predTableHeadRow.appendChild(predTableHeadRowCode);
  predTableHeadRow.appendChild(predTableHeadRowName);
  predTableHeadRow.appendChild(predTableHeadRowType);
  predTableHeadRow.appendChild(predTableHeadRowLag);
  predTableHead.appendChild(predTableHeadRow);
  predTable.appendChild(predTableHead);
  predTable.appendChild(predTableBody);
  parser.getPredecessors(task.id).forEach((predecessor) => {
    const row = document.createElement("tr");
    const codeCell = document.createElement("td");
    const nameCell = document.createElement("td");
    const typeCell = document.createElement("td");
    const lagCell = document.createElement("td");
    codeCell.innerHTML = predecessor.code;
    nameCell.innerHTML = predecessor.name;
    typeCell.innerHTML = predecessor.type;
    lagCell.innerHTML = predecessor.lag;
    row.appendChild(codeCell);
    row.appendChild(nameCell);
    row.appendChild(typeCell);
    row.appendChild(lagCell);
    predTableBody.appendChild(row);
  });
  predDiv.appendChild(predTable);
}

function createResourceTable(task, parser) {
  const resourcediv = document.getElementById("Resources");
  resourcediv.innerHTML = "";
  const resourceTable = document.createElement("table");
  const resourceTableHead = document.createElement("thead");
  const resourceTableBody = document.createElement("tbody");
  const resourceTableHeadRow = document.createElement("tr");
  const resourceTableHeadRowResource = document.createElement("th");
  const resourceTableHeadRowQuantity = document.createElement("th");
  resourceTableHeadRowResource.innerHTML = "Resource";
  resourceTableHeadRowQuantity.innerHTML = "Quantity";
  resourceTableHeadRow.appendChild(resourceTableHeadRowResource);
  resourceTableHeadRow.appendChild(resourceTableHeadRowQuantity);
  resourceTableHead.appendChild(resourceTableHeadRow);
  resourceTable.appendChild(resourceTableHead);
  resourceTable.appendChild(resourceTableBody);
  parser.getActivityResource(task.id).forEach((resource) => {
    const row = document.createElement("tr");
    const resourceCell = document.createElement("td");
    const quantityCell = document.createElement("td");
    resourceCell.innerHTML = resource.resource;
    quantityCell.innerHTML = resource.quantity;
    row.appendChild(resourceCell);
    row.appendChild(quantityCell);
    resourceTableBody.appendChild(row);
  });
  console.log(resourceTable);
  resourcediv.appendChild(resourceTable);
}
