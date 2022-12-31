import { Component } from '@angular/core';
import * as d3 from 'd3';
import moment from 'moment'

import DataInfo from '../assets/datainfo.json';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'LOC-counter';

  asMoment: moment.Moment[] = [];
  datasize: number = 0;
  readDone: number = 0;
  VERBOSE = 0;

  ngOnInit(): void {
    if (this.VERBOSE)
      console.log(DataInfo);

    this.datasize = DataInfo['files'].length
    let accuData: any[] = [];
    
    for (let i = 0; i < this.datasize; i++) {
      let file: Observable<any> = this.http.get('assets/' + DataInfo['files'][i]);
      file.subscribe(data => {

        if (this.VERBOSE) {
          console.log(DataInfo['files'][i].split('.')[0])
          console.log(data);
        }

        accuData.push(data['All']);

        /* Check missing data */
        for (let eidx = 0; eidx < DataInfo['extensions'].length; eidx++) {
          let ext = DataInfo['extensions'][eidx];
          if (!(ext in data['All'])) {
            data['All'][ext] = 0;
          }
        }

        this.asMoment.push(moment(DataInfo['files'][i].split('.')[0]));
        this.readDone += 1;

        if (this.readDone == this.datasize) {
          console.log(this.asMoment);
          this.drawGraph("#chart1", accuData, "area",  DataInfo['extensions']);
          this.drawGraph("#chart2", accuData, "bar", DataInfo['extensions']);
        }
      });
    }
  }

  constructor(private http: HttpClient) { }

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
        return xScale(this.asMoment[i]) - (barWidth / 2);
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
    
    var areaGen = d3.area()
      .x((d, i) => xScale(this.asMoment[i]))
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
    let useCustomFmt = 0;
    let xAxis;
    if (!useCustomFmt) {
      xAxis = d3.axisBottom(xScale);
    } else {
      xAxis = d3.axisBottom(xScale).ticks(5)
        .tickFormat((d, i) => {
          console.log('format');
          return this.asMoment[i].format('YY-MM-DD');
        });
    }

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

  drawGraph(selector: string, data:any[], kind: string, keys: string[]): void {
    /* Stack Data Generator */
    var stackGen = d3.stack().keys(keys);

    /* Generate Data */
    var stackedSeries = stackGen(data);

    console.log(stackedSeries);

    let maxDate = moment.max(this.asMoment).clone();
    let minDate = moment.min(this.asMoment).clone();

    if (kind == "bar") {
      minDate.add(-6, 'hours');
      maxDate.add(6, 'hours');
    }

    /* Scale */
    var xScale = d3.scaleTime()
      .domain([minDate, maxDate])
      .range([50, 600]);

    var yScale = d3.scaleLinear()
      // .domain([0, 20000])
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

}
