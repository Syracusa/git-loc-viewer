import { Component } from '@angular/core';
import * as d3 from 'd3';
import moment from 'moment';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatSelectChange } from '@angular/material/select';
/* One repoinfo in file */
interface RepoLocDatum {
  [ext: string]: number | moment.Moment;
}

/* One data file */
interface LocDataWithTime {
  date: moment.Moment;
  locDatum: Map<string, RepoLocDatum>;
}

interface GraphElem {
  graph: any;
  xaxis: any;
  yaxis: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LOC-counter';
  VERBOSE = 1;

  selectedRepo: string = "All";

  dataFileNum: number = 0;

  repoSet = new Set<string>;
  locData: LocDataWithTime[] = [];
  parsedFileNum = 0;
  dataMetaInfo: any;

  g1: GraphElem = { graph: undefined, xaxis: undefined, yaxis: undefined };
  g2: GraphElem = { graph: undefined, xaxis: undefined, yaxis: undefined };

  ngOnInit(): void {
    let file: Observable<any> = this.http.get('../assets/datainfo.json');
    file.subscribe(data => {
      this.dataMetaInfo = data;
      this.dataFileNum = data['files'].length;
      this.getDataFromJSON(this.cbDataRecvDone);
    });
  }

  constructor(private http: HttpClient) { }

  onOptionSelected(event: MatSelectChange) {
    console.log(event.value);
    this.drawRepoGraph(event.value as string, 600, 300);
  }

  cbDataRecvDone(ctx: AppComponent): void {
    ctx.locData.sort(function (a, b) { return a.date.unix() - b.date.unix(); });
    console.log("locdata", ctx.locData);
    ctx.buildRepoSet();
    ctx.drawRepoGraph('All', 600, 300);
  }

  getDataFromJSON(cb: (ctx: AppComponent) => void): void {
    for (let i = 0; i < this.dataFileNum; i++) {

      let dataFileName = this.dataMetaInfo['files'][i];
      let dataFileNameWithDir = 'assets/' + dataFileName;

      let file: Observable<any> = this.http.get(dataFileNameWithDir);
      file.subscribe(data => {
        let locDatum = new Map<string, RepoLocDatum>;
        for (const [k, v] of Object.entries(data)) {
          locDatum.set(k, v as RepoLocDatum);
        }
        let datum: LocDataWithTime = {
          date: moment(dataFileName.split('.')[0]),
          locDatum: locDatum
        };

        this.locData.push(datum);
        this.parsedFileNum++;
        if (this.parsedFileNum == this.dataFileNum) {
          cb(this);
        }
      });
    }
  }

  buildRepoSet(): void {
    for (let i = 0; i < this.locData.length; i++) {
      let locDatum = this.locData[i].locDatum;
      locDatum.forEach((v, k) => {
        this.repoSet.add(k);
      });
    }
    if (this.VERBOSE)
      console.log("reposet", this.repoSet);
  }

  drawRepoGraph(repoName: string, width: number, height: number): void {
    let repoData: any[] = [];
    for (let i = 0; i < this.locData.length; i++) {
      let repoDatum = this.locData[i].locDatum.get(repoName);
      if (repoDatum !== undefined) {
        repoDatum['date'] = this.locData[i].date;
        /* Check missing data */
        for (let eidx = 0; eidx < this.dataMetaInfo['extensions'].length; eidx++) {
          let ext = this.dataMetaInfo['extensions'][eidx];
          if (!(ext in repoDatum)) {
            repoDatum[ext] = 0;
          }
        }


        repoData.push(repoDatum);
      }



    }
    this.drawGraph(this.g1, "#chart1", repoData, "area", this.dataMetaInfo['extensions'], width, height);
    this.drawGraph(this.g2, "#chart2", repoData, "bar", this.dataMetaInfo['extensions'], width, height);
  }

  drawGraph(g: GraphElem,
    selector: string,
    data: any[],
    kind: string,
    keys: string[],
    width: number,
    height: number)
    : void {
    /* Stack Data Generator */
    var stackGen = d3.stack().keys(keys);

    /* Generate Data */
    var stackedSeries = stackGen(data);
    let datearr = data.map(function (d) { return d['date'] });

    console.log("stackedSeries", stackedSeries);
    console.log(datearr);


    let datalen = stackedSeries.length;
    let datumlen = stackedSeries[0].length;
    let ymax = stackedSeries[datalen - 1][datumlen - 1][1];

    let maxDate = moment.max(datearr).clone();
    let minDate = moment.min(datearr).clone();

    if (kind == "bar") {
      minDate.add(-6, 'hours');
      maxDate.add(6, 'hours');
    }

    /* Scale */
    var xScale = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([50, width - 50]);

    var yScale = d3.scaleLinear()
      .domain([0, ymax])
      .range([height - 50, 50])
      .nice();

    /* Graph */
    if (kind == "bar") {
      this.drawBarChart(selector, stackedSeries, xScale, yScale);
    } else {
      this.drawAreaChart(selector, stackedSeries, xScale, yScale);
    }

    /* Axes */
    this.drawAxes(g, selector, xScale, yScale, width, height);
  }

  drawBarChart(
    selector: string,
    stackdata: d3.Series<{ [key: string]: number; }, string>[],
    xScale: any,
    yScale: any): void {

    var colors = d3.schemePaired;

    /* Draw Bars */
    let barWidth = 20;

    d3.select(selector)
      .selectAll("g.bars")
      .data(stackdata)
      .enter()
      .append("g")
      .classed('bars', true)
      .style("fill", function (d, i) {
        return colors[i];
      })
      .selectAll('rect')
      .data(function (d) {
        return d;
      })
      .join('rect')
      .attr("x", (d, i) => {
        return xScale(d.data['date']) - (barWidth / 2);
      })
      .attr("y", function (d, i) {
        return yScale(d[1]);
      })
      .attr("height", function (d) {
        return yScale(d[0]) - yScale(d[1]);
      })
      .attr("width", function (d) {
        return barWidth;
      });
  }

  private buildAreaData(
    stackdata: d3.Series<{ [key: string]: number; }, string>[])
    : Array<[number, number]>[] {

    let newdata: Array<[number, number]>[] = [];
    for (let i = 0; i < stackdata.length; i++) {
      let mydata: Array<[number, number]> = [];
      for (let j = 0; j < stackdata[i].length; j++) {
        mydata.push([stackdata[i][j][0], stackdata[i][j][1]]);
      }
      newdata.push(mydata);
    }
    return newdata;
  }

  drawAreaChart(
    selector: string,
    stackdata: d3.Series<{ [key: string]: number; }, string>[],
    xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>): void {

    let newdata = this.buildAreaData(stackdata);
    var colors = d3.schemePaired;
    let datearr = stackdata[0].map(function (d) { return d['data']['date'] });

    var areaGen = d3.area()
      .x((d, i) => xScale(datearr[i]))
      .y0((d, i) => yScale(d[0]))
      .y1((d, i) => yScale(d[1]));

    d3.select(selector)
      .selectAll("path")
      .data(newdata)
      .join("path")
      .attr("fill", function (d, i) { return colors[i]; })
      .attr("d", (d, i) => areaGen(d));
  }

  private drawAxes(
    g: GraphElem,
    selector: string,
    xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,
    width: number,
    height: number)
    : void {

    /* Draw Axes */
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisRight(yScale);

    if (g.xaxis == undefined) {
      console.log("xappend");
      g.xaxis = d3.select(selector)
        .append("g")
        .call(xAxis)
        .attr("transform", "translate(" + 0 + ", " + (height - 50) + ")");
    } else {
      g.xaxis.call(xAxis);
    }
    if (g.yaxis == undefined) {
      g.yaxis = d3.select(selector)
        .append("g")
        .call(yAxis)
        .attr("transform", "translate(" + (width - 50) + ", " + 0 + ")");
    } else {
      g.yaxis.call(yAxis);
    }
  }
}
