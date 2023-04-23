import { ResourceAllocation, TaskActv, Predecessor } from "./interfaces";

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
        start_date: activity.early_start_date
          ? new Date(activity.early_start_date)
          : new Date(activity.act_start_date),
        end: activity.early_end_date
          ? new Date(activity.early_end_date)
          : new Date(activity.act_end_date),
        end_date: activity.early_end_date
          ? new Date(activity.early_end_date)
          : new Date(activity.act_end_date),
        parent: parseInt(activity.wbs_id),
      };
      this.activities.push(obj);
    }
    return this.activities;
  }

  calculateDates(data: any) {
    const startDates: any = {};
    const finishDates: any = {};

    function dfs(nodeId: number) {
      const node = data.find((n: any) => n.id === nodeId);
      if (!node) {
        return null;
      }

      const childIds = data
        .filter((n: any) => n.parent === nodeId)
        .map((n: any) => n.id);
      const childStartDates = childIds.map((childId: any) => dfs(childId));

      let minStartDate = Infinity;
      let maxFinishDate = null;
      for (let i = 0; i < childIds.length; i++) {
        const childId = childIds[i];
        const childStartDate = childStartDates[i];
        if (childStartDate !== null && childStartDate < minStartDate) {
          minStartDate = childStartDate;
        }
        const childFinishDate = finishDates[childId] as any;
        if (
          childFinishDate !== null &&
          childFinishDate !== undefined &&
          (maxFinishDate === null || childFinishDate > maxFinishDate)
        ) {
          maxFinishDate = childFinishDate;
        }
      }

      const startDate = minStartDate === Infinity ? node.start : minStartDate;
      startDates[nodeId] = startDate;

      const finishDate = maxFinishDate === null ? node.end : maxFinishDate;
      finishDates[nodeId] = finishDate;

      return startDate;
    }

    data.forEach((node: any) => {
      if (!node.parent) {
        dfs(node.id);
      }
    });
    console.log("FINISH DATE", finishDates);

    let res: any[] = [];
    data.map((node: any) => {
      res.push({
        id: node.id,
        name: node.name,
        start: startDates[node.id],
        end: finishDates[node.id],
        parent: node.parent,
      });
    });
    console.log("RES", res);
    return res;
  }

  getWBS() {
    const toReturn: any[] = [];
    const acts = this.getActivities();
    let wbss = this.byType["PROJWBS"];
    let tot = [];
    wbss[0].parent_wbs_id = null;
    for (let wbs of wbss) {
      let obj = {
        id: parseInt(wbs.wbs_id),
        name: wbs.wbs_name,
        start: null as Date | null,
        start_date: null as Date | null,
        end: null as Date | null,
        end_date: null as Date | null,
        parent: wbs.parent_wbs_id ? parseInt(wbs.parent_wbs_id) : null,
      };
      console.log("WBS", obj);

      tot.push(obj);
    }

    tot = [...tot, ...this.activities];
    const result = this.calculateDates(tot);
    return result;
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
    if (taskCodes) {
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
    return [];
  }

  getPredecessors(id: number) {
    const s_id = id.toString();
    let to_return: Predecessor[] = [];
    let taskPreds = this.byType["TASKPRED"];
    let currTskPreds = taskPreds.filter((pred) => {
      return pred.task_id === s_id;
    });
    console.log("Preds", currTskPreds);
    currTskPreds.forEach((pred) => {
      const pred_objs = this.byType["TASK"].filter((t) => {
        return t.task_id.toString() === pred["pred_task_id"].toString();
      }) as any;
      console.log("Pred Obj ", pred["pred_task_id"], pred_objs);
      for (const pred_obj of pred_objs) {
        let obj = {
          id: parseInt(pred_obj["task_id"]),
          code: pred_obj["task_code"],
          name: pred_obj["task_name"],
          type: pred.pred_type,
          lag: parseFloat(pred.lag_hr_cnt),
        };
        to_return.push(obj);
      }
    });
    console.log("Predecessors", to_return);
    return to_return;
  }
}
