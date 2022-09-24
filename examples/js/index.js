import { GanttChart } from "4d-gantt-chart";
import { XERParser } from "xer.js";

const fileInput = document.getElementById("file");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  const fileuRL = URL.createObjectURL(file);
  const parser = new XERParser(file);
  // const activities = [];
  setTimeout(() => {
    const activities = parser.getActivities();
    const wbss = parser.getWBS();
    const scheduleData = wbss.concat(activities);
    console.log("schedule Data", scheduleData);
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

    let gantt = new GanttChart(options);
    console.log("MINMAX", gantt.minDate, gantt.maxDate);
    gantt.draw();
  }, 5000);

  // console.log(parser.getActivities());

  const reader = new FileReader();
  reader.onload = (event) => {
    // console.log(reader.result);
  };
  reader.readAsText(file);
});
