import { ResourceAllocation, TaskActv } from "./interfaces";

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

    reader.readAsText(file, "windows-1256");
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
        const parenOf = this.byType["PROJWBS"].filter((wbs2) => {
          return wbs2.parent_wbs_id === wbs.wbs_id;
        });
        if (parenOf.length > 0) {
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
    }
    let res = toReturn.map((d) => {
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
    // res = res.filter((d) => {
    //   return (
    //     d.start > new Date(1970, 1, 1) &&
    //     d.end < new Date(2100, 1, 1) &&
    //     d.start !== null &&
    //     d.end !== null
    //   );
    // });
    console.log("RES", res);

    return res;
  }

  getActivityResource(id: number) {
    const s_id = id.toString();
    let to_return: ResourceAllocation[] = [];
    let taskRsrc = this.byType["TASKRSRC"];
    let currTskRsrc = taskRsrc.filter((rsrc) => {
      return rsrc.task_id === s_id;
    });
    currTskRsrc.forEach((trsrc) => {
      let rsrcObj: any = this.byId[trsrc.rsrc_id];
      let obj = {
        resource: rsrcObj["rsrc_short_name"] as string,
        quantity: parseFloat(trsrc.target_qty),
      };
      to_return.push(obj);
    });

    return to_return;
  }

  getActivityCodes(id: number) {
    const s_id = id.toString();
    let to_return: TaskActv[] = [];
    let taskCodes = this.byType["TASKACTV"];
    let currTskCodes = taskCodes.filter((code) => {
      return code.task_id === s_id;
    });
    currTskCodes.forEach((code) => {
      const type = this.byId[code.actv_code_type_id] as any;
      console.log("Type ", type);
      const codeName = this.byId[code.actv_code_id] as any;
      console.log("Code ", codeName);
      let obj = {
        type: type.actv_code_type,
        code: codeName.actv_code_name,
      };
      to_return.push(obj);
    });

    return to_return;
  }
}
