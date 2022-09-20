import { XERParser } from "xer.js";

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
