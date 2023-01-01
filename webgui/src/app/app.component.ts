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
  selector : any;
  height : number;
  width : number;

  graph ?: any;
  xaxis ?: any;
  yaxis ?: any;
  legend ?: any;
  labels ?: any;
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

  g1: GraphElem = { selector:"#chart1", width: 600, height: 300};
  g2: GraphElem = { selector:"#chart2", width: 600, height: 300 };

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
    this.drawRepoGraph(event.value as string);
  }

  cbDataRecvDone(ctx: AppComponent): void {
    ctx.locData.sort(function (a, b) { return a.date.unix() - b.date.unix(); });
    console.log("locdata", ctx.locData);
    ctx.buildRepoSet();
    ctx.drawRepoGraph('All');
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

  drawRepoGraph(repoName: string): void {
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
    this.drawGraph(this.g1, repoData, "area", this.dataMetaInfo['extensions']);
    this.drawGraph(this.g2, repoData, "bar", this.dataMetaInfo['extensions']);
  }

  drawGraph(g: GraphElem,
    data: any[],
    kind: string,
    keys: string[])
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
      .range([50, g.width - 50]);

    var yScale = d3.scaleLinear()
      .domain([0, ymax])
      .range([g.height - 50, 50])
      .nice();

    /* Graph */
    if (kind == "bar") {
      this.drawBarChart(g, stackedSeries, xScale, yScale);
    } else {
      this.drawAreaChart(g, stackedSeries, xScale, yScale);
    }

    /* Axes */
    this.drawAxes(g, xScale, yScale);

    this.drawLegend(g);
  }

  drawBarChart(
    g: GraphElem,
    stackdata: d3.Series<{ [key: string]: number; }, string>[],
    xScale: any,
    yScale: any): void {

    var colors = d3.schemePaired;

    /* Draw Bars */
    let barWidth = 20;


    if (g.graph == undefined) {
      g.graph = d3.select(g.selector)
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
    } else {
      g.graph = d3.select(g.selector)
        .selectAll("g.bars")
        .data(stackdata)
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
    g: GraphElem,
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

    g.graph = d3.select(g.selector)
      .selectAll("path")
      .data(newdata)
      .join("path")
      .attr("fill", function (d, i) { return colors[i]; })
      .attr("d", (d, i) => areaGen(d))
      .attr("text-anchor", "middle")
      .on('mouseover', function(d, i) { /* TBD */});
  }

  private drawAxes(
    g: GraphElem,
    xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,)
    : void {

    /* Draw Axes */
    let xAxis = d3.axisBottom(xScale);
    let yAxis = d3.axisRight(yScale);

    if (g.xaxis == undefined) {
      console.log("xappend");
      g.xaxis = d3.select(g.selector)
        .append("g")
        .call(xAxis)
        .attr("transform", "translate(" + 0 + ", " + (g.height - 50) + ")");
    } else {
      g.xaxis.call(xAxis);
    }
    if (g.yaxis == undefined) {
      g.yaxis = d3.select(g.selector)
        .append("g")
        .call(yAxis)
        .attr("transform", "translate(" + (g.width - 50) + ", " + 0 + ")");
    } else {
      g.yaxis.call(yAxis);
    }
  }

  private drawLegend(g: GraphElem): void{
    let size = 5;
    var colors = d3.schemePaired;

    let catnum = this.dataMetaInfo['extensions'].length;

    if (g.legend == undefined){
      g.legend = d3.select(g.selector)
      .selectAll(".legendRect")
      .data(this.dataMetaInfo['extensions'])
      .enter()
      .append("rect")
      .classed("regendRect", true)
      .attr("x", g.width)
      .attr("y", function(d,i){ return 30 + (catnum - i)*(size+5)})
      .attr("width", size)
      .attr("height", size)
      .style("fill", function(d, i){ return colors[i];})
    }
    
    if (g.labels == undefined){
      g.labels = d3.select(g.selector)
      .selectAll(".legendLabel")
      .data(this.dataMetaInfo['extensions'])
      .enter()
      .append("text")
      .classed("legendLabel", true)
        .attr("x", g.width + size * 1.2)
        .attr("y", function(d,i){ return 30 + (catnum - i)*(size+5) + (size/2)})
        .style("fill", function(d, i){ return colors[i]; })
        .style("font-size", "10px")
        .text(function(d, i) {return d as string;})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");
    }
  }
}
