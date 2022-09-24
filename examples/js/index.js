import { GanttChart } from "4d-gantt-chart";
import { XERParser } from "xer.js";

const fileInput = document.getElementById("file");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const fileuRL = URL.createObjectURL(file);
  const pareStart = Date.now();
  const parser = new XERParser(file);
  const parseEnd = Date.now();
  console.log("parse time: ", parseEnd - pareStart);
  // const activities = [];
  setTimeout(async () => {
    const getActStart = Date.now();
    const activities = parser.getActivities();
    const getActEnd = Date.now();
    console.log("get activities time: ", getActEnd - getActStart);
    const getWbsStart = Date.now();
    const wbss = parser.getWBS();
    const getWbsEnd = Date.now();
    console.log("get wbss time: ", getWbsEnd - getWbsStart);
    const scheduleData = wbss.concat(activities);
    console.log(scheduleData);
    let container = document.getElementById("ganttChart");
    container.innerHTML = "";
    let options = {
      container: container,
      showBaseline: false,
      dataDate: new Date(2022, 0, 15),
      gridScale: 5,
      gridColor: "black",
      data: scheduleData,
      titleOptions: "Music",
      rowHeight: 30,
      timeLineColumnWidth: 20,
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
    const ganttStart = Date.now();
    let gantt = new GanttChart(options);
    gantt.draw();
    const ganttEnd = Date.now();
    console.log("gantt time: ", ganttEnd - ganttStart);

    console.log("MINMAX", gantt.minDate, gantt.maxDate);
    gantt.on("taskClicked", (task) => {
      console.log("Event Data:", task);
      // alert("Clicked " + task.id + " " + task.name);
    });
  }, 100);

  // console.log(parser.getActivities());

  const reader = new FileReader();
  reader.onload = (event) => {
    // console.log(reader.result);
  };
  reader.readAsText(file);
});
