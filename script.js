/**
 * Copyright (C) 2019 Gert Vaartjes 
 * 
 * DEMO for showing how to synchronize selected points in the chart with table cells and vice versa
 *
 * TODO: toggle hiding series through the legend, recreates the table. Then the variables holding the elements are lost. 
 * Should refine the the demo a bit, and define the variables on the fly. Legend click is now disables
 */

const getCell = (trIdx, idx) => {
  let rows = document.querySelectorAll("#highcharts-data-table-0 tbody tr");
  return rows[trIdx].cells[idx]
}

// turn html collection into array
const htmlCollectionToArray = (nodes) => Array.prototype.slice.call(nodes);

// get the array of headers
const getHHeaders = () => htmlCollectionToArray(document.querySelectorAll("#highcharts-data-table-0 thead th")).map(x => x.innerHTML);
const getVHeaders = () => htmlCollectionToArray(document.querySelectorAll("#highcharts-data-table-0 tbody th")).map(x => x.innerHTML);

const getSelectedCell = () => Array.prototype.slice.call(document.querySelectorAll('#highcharts-data-table-0 tbody .selected'));

let vHeaders, hHeaders;

// function for selecting the table cell corresponding the selected datapoint in the chart
const selectCell = function () {
  // deselect previous cell, if exist
  getSelectedCell().map(x => x.classList.remove('selected'));
  
  vHeaders = vHeaders ? vHeaders : getVHeaders();
  hHeaders = hHeaders ? hHeaders : getHHeaders();

  let selected = getCell(vHeaders.indexOf(this.category),hHeaders.indexOf(this.series.name));
  selected.classList.add('selected');               
}

const selectSeriesPoint = (rowIdx, colIdx) => {
  
};

document.addEventListener('DOMContentLoaded', () => {
  
  let selected;

  let chart = Highcharts.chart("container", {
    title: {
      text: "Solar Employment Growth by Sector, 2010-2016"
    },

    subtitle: {
      text: "A demo of displaying a data table in Highcharts"
    },

    credits: {
      text: "Source: thesolarfoundation.com"
    },

    chart: {
      borderWidth: 1,
      borderColor: "#ccc",
      spacingBottom: 30,
      type: 'column'
    },

    yAxis: {
      title: {
        text: "Number of Employees"
      }
    },
    xAxis: {
      categories: ['NL', 'ES', 'DE', 'BE', 'NO', 'UK', 'IR', 'CH']
    },
    legend: {
      layout: "vertical",
      align: "right",
      verticalAlign: "middle"
    },

    plotOptions: {
      series: {
        allowPointSelect: true,
        pointPadding:0,
        point: {
          events: {
            select: selectCell
          }
        },
        states: {
          select: {
            color: 'tomato',
            borderColor: 'black'
          }
        },
        events: {
          legendItemClick: function() { return false}
        }
      }
    },

    series: [    
      {
        name: "Installation",
        data: [43934, 52503, 57177, 69658, 97031, 119931, 137133, 154175]
      },
      {
        name: "Manufacturing",
        data: [24916, 24064, 29742, 29851, 32490, 30282, 38121, 40434]
      },
      {
        name: "Distribution",
        data: [11744, 17722, 16005, 19771, 20185, 24377, 32147, 39387]
      }
    ],

    exporting: {
      showTable: true
    }
  });
  
  // Event listener and attach function to highlight corresponding datapoint in the chart when slecting a table cell
  document.querySelector("#highcharts-data-table-0 tbody").addEventListener("click", 
   function(e) { 
    let cellIdx = e.target.cellIndex
    
    // prevent selecting category column 
    if (cellIdx < 1) { e.preventDefault(); return false;}
    
    let point = chart.series[cellIdx -1].points[e.target.parentNode.rowIndex -1];
    point.select(true);
  });

});