export class XERParser {
  file: Blob;
  fileReader: FileReader;
  byType: { [key: string]: any[] };
  byId: { [key: string]: string };
  activities: { [key: string]: any | null }[] = [];

  constructor(file: Blob) {
    this.file = file;
    this.fileReader = new FileReader();
    this.byType = Object.create({});
    this.byId = Object.create({});
    this.readTextFile(this.file);
  }

  private readTextFile(file: Blob) {
    const reader = new FileReader();

    reader.onload = (e) => {
      var allText = reader.result as string;
      const lines = allText.split("\r\n");

      let tableTitle: string;
      let lineArrayKeys: string[];
      let lineArrayValues: string[];
      for (let line of lines) {
        //Split lines to array elements
        let splittedLine = line.split("\t");

        if (splittedLine[0] === "%T") {
          tableTitle = splittedLine[1].trim();
          this.byType[tableTitle] = [];
        } else if (splittedLine[0] === "%F") {
          //Add to array head names
          lineArrayKeys = splittedLine.slice(1);
        } else if (splittedLine[0] === "%R") {
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
    };

    reader.readAsText(file);
  }

  getActivities() {
    let tasks = this.byType["TASK"];
    for (const activity of tasks) {
      let obj = {
        id: parseInt(activity.task_id),
        name: activity.task_name,
        start: activity.early_start_date
          ? new Date(activity.early_start_date)
          : new Date(activity.act_start_date),
        end: activity.early_end_date
          ? new Date(activity.early_end_date)
          : new Date(activity.act_end_date),
        parent: parseInt(activity.wbs_id),
      };
      this.activities.push(obj);
    }
    return this.activities;
  }

  getWBS() {
    const toReturn: any[] = [];
    let wbss = this.byType["PROJWBS"];
    console.log(wbss[0]);
    wbss[0].parent_wbs_id = null;
    for (const wbs of wbss) {
      let activities = this.activities.filter((activity) => {
        return activity.parent === parseInt(wbs.wbs_id);
      });
      if (activities.length > 0) {
        let minStart: Date;
        let maxEnd: Date;
        for (let act of activities) {
          if (minStart === undefined || act.start < minStart) {
            minStart = new Date(act.start);
          }
          if (maxEnd === undefined || act.end > maxEnd) {
            maxEnd = new Date(act.end);
          }
        }
        wbs.start = minStart;
        wbs.end = maxEnd;
        let wbsObj = {
          id: parseInt(wbs.wbs_id),
          name: wbs.wbs_name,
          start: minStart,
          end: maxEnd,
          parent: wbs.parent_wbs_id ? parseInt(wbs.parent_wbs_id) : null,
        };
        toReturn.push(wbsObj);
      } else {
        let wbsObj: any = {
          id: parseInt(wbs.wbs_id),
          name: wbs.wbs_name,
          start: null,
          end: null,
          parent: wbs.parent_wbs_id ? parseInt(wbs.parent_wbs_id) : null,
        };
        toReturn.push(wbsObj);
      }
    }
    const res = toReturn.map((d) => {
      const getMin = (obj: any, prop: string): any => {
        const children = toReturn.filter(({ parent }) => parent === obj.id);
        if (children.length === 0) return obj[prop];
        return children.reduce(
          (acc, c) => new Date(Math.min(acc, getMin(c, prop))),
          new Date(2100, 1, 1)
        );
      };
      const getMax = (obj: any, prop: string): any => {
        const children = toReturn.filter(({ parent }) => parent === obj.id);
        if (children.length === 0) return obj[prop];
        return children.reduce(
          (acc, c) => new Date(Math.max(acc, getMax(c, prop))),
          new Date(1970, 1, 1)
        );
      };
      return {
        ...d,
        start: getMin(d, "start"),
        end: getMax(d, "end"),
      };
    });
    console.log(res);

    return res;
  }
}
