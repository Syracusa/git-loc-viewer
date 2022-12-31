import { Component } from '@angular/core';
import * as d3 from 'd3';
import moment from 'moment';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* One repoinfo in file */
interface RepoLocDatum {
  [ext: string]: number | moment.Moment;
}

/* One data file */
interface LocDataWithTime {
  date: moment.Moment;
  locDatum: Map<string, RepoLocDatum>;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LOC-counter';
  VERBOSE = 0;

  dataFileNum: number = 0;
  readDone: number = 0;
  repoSet = new Set<string>;
  locData: LocDataWithTime[] = [];
  parsedFileNum = 0;
  dataMetaInfo: any;

  ngOnInit(): void {
    let file: Observable<any> = this.http.get('../assets/datainfo.json');
    file.subscribe(data => {
      this.dataMetaInfo = data;
      this.dataFileNum = data['files'].length;
      this.getDataFromJSON(this.cbDataRecvDone);
    });
  }

  constructor(private http: HttpClient) { }

  cbDataRecvDone(ctx: AppComponent):void {
    ctx.locData.sort(function (a, b) {return a.date.unix() - b.date.unix();});
    console.log("Datafile read done!");
    console.log(ctx.locData);
    ctx.buildRepoSet();
    ctx.drawRepoGraph('All');
  }

  getDataFromJSON(cb: (ctx: AppComponent)=>void ): void {
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
      console.log(this.repoSet);
  }

  drawRepoGraph(repoName: string): void {
    let repoData: any[] = [];
    for (let i = 0; i < this.locData.length; i++) {
      if (this.VERBOSE) {
        console.log(this.locData[i].date);
        console.log(this.locData[i].locDatum);
      }

      let repoDatum = this.locData[i].locDatum.get(repoName);
      if (repoDatum === undefined) {
        repoDatum = {};
      }
      repoDatum['date'] = this.locData[i].date;

      /* Check missing data */
      for (let eidx = 0; eidx < this.dataMetaInfo['extensions'].length; eidx++) {
        let ext = this.dataMetaInfo['extensions'][eidx];
        if (!(ext in repoDatum)) {
          repoDatum[ext] = 0;
        }
      }

      repoData.push(repoDatum);

      // this.asMoment.push(moment(this.dataMetaInfo['files'][i].split('.')[0]));
      this.readDone += 1;
      if (this.readDone == this.dataFileNum) {
        // console.log(this.asMoment);
        this.drawGraph("#chart1", repoData, "area", this.dataMetaInfo['extensions']);
        this.drawGraph("#chart2", repoData, "bar", this.dataMetaInfo['extensions']);
      }
    }
  }

  drawGraph(selector: string, data: any[], kind: string, keys: string[]): void {
    /* Stack Data Generator */
    var stackGen = d3.stack().keys(keys);

    /* Generate Data */
    var stackedSeries = stackGen(data);
    let datearr = data.map(function(d) {return d['date']});

    console.log(datearr);

    let maxDate = moment.max(datearr).clone();
    let minDate = moment.min(datearr).clone();

    if (kind == "bar") {
      minDate.add(-6, 'hours');
      maxDate.add(6, 'hours');
    }

    /* Scale */
    var xScale = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([50, 600]);

    var yScale = d3.scaleLinear()
      .domain([0, 20000])
      .range([450, 50])
      .nice();

    /* Graph */
    if (kind == "bar") {
      this.drawBarChart(selector, stackedSeries, xScale, yScale);
    } else {
      this.drawAreaChart(selector, stackedSeries, xScale, yScale);
    }

    /* Axes */
    this.drawAxes(selector, xScale, yScale);
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
        mydata.push([stackdata[i][j][0], stackdata[i][j][1] ]);
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
    let datearr = stackdata[0].map(function(d) {return d['data']['date']});

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
    selector: string,
    xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>)
    : void {

    /* Draw Axes */
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisRight(yScale);

    d3.select(selector)
      .append("g")
      .call(xAxis)
      .attr("transform", "translate(" + 0 + ", " + 450 + ")");

    d3.select(selector)
      .append("g")
      .call(yAxis)
      .attr("transform", "translate(" + 600 + ", " + 0 + ")");
  }
}
