'use strict';
/*global Highcharts*/

/* DEMO for showing how to synchronize selected points in the chart by highlighting
 * the table cells and vice versa.
 *
 * TODO: toggle hiding series through the legend, recreates the table. Then the variables holding the elements are lost. 
 * Legend click is now disables
 */

const getCell = (trIdx, idx) => {
  let rows = document.querySelectorAll("#highcharts-data-table-0 tbody tr");
  return rows[trIdx].cells[idx]
}

// turn html collection into array
const htmlCollectionToArray = (nodes) => Array.prototype.slice.call(nodes);

// attach eventlistener to array of HTML elements
const attachEventListenerToElements = (elementsArr, eventName, listener) => {
  elementsArr.forEach(elem => elem.addEventListener(eventName, listener))
}

// get the array of headers
const getHHeaders = () => htmlCollectionToArray(
  document.querySelectorAll("#highcharts-data-table-0 thead th")).map(x => x.innerHTML);
const getVHeaders = () => htmlCollectionToArray(
  document.querySelectorAll("#highcharts-data-table-0 tbody th")).map(x => x.innerHTML);

const getTableCellsForColumn = (elem) => {
    // Get the cells in the row except for the first cell containing category label
    let cellsInRow = htmlCollectionToArray(document.querySelectorAll('#highcharts-data-table-0 tr')).slice(1);     
    // build array with cells for index in every row
    return cellsInRow.reduce((acc,curr)=> {
      let c = curr.children.item(elem.cellIndex);
      acc.push(c);
      return acc;
    }, []);
  }

/**
* function for selecting the table cells corresponding the selected datapoints in the chart
*/
const selectTableCell = function (point) {
  let vHeaders = vHeaders ? vHeaders : getVHeaders();
  let hHeaders = hHeaders ? hHeaders : getHHeaders();
  let selected = getCell(vHeaders.indexOf(point.category),
    hHeaders.indexOf(point.series.name));

  // remove or add the classname on the element to select/deselect the tablecell
  DOMTokenList.prototype[point.selected? 'remove' : 'add'].apply(selected.classList, ['selected']);
};

const updateSelectionOfSeriesPoint = (chart, tableCellArr) => {
    tableCellArr.forEach((cell) => {
      let cellIdx = cell.cellIndex;
      let point = chart.series[cellIdx -1].points[cell.parentNode.rowIndex -1];
      // contains classList selected, then deselect point and v.v.
      point.select(!cell.classList.contains('selected'),true);
    })
    
}

/**
 * selected area in chart is used to filter which series points fall within the selected area
 * Normally used to zoom in, but we return false to prevent that happening
 */
function selectPointsByDrag(e) {
    // Select points
    Highcharts.each(this.series, function (series) {
        Highcharts.each(series.points, function (point) {
            if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
                    point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
                point.select(true,true);
            }
        });
    });
    
    return false; // Don't zoom
}

/**
 * On click, unselect all points
 */
function unselectByClick() {
    var points = this.getSelectedPoints();
    if (points.length > 0) {
        Highcharts.each(points, function (point) {
            point.select(false, true);
        });
    }
}

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
      type: 'line',
      events: {
            selection: selectPointsByDrag,
            click: unselectByClick
        },
      // necesssary to be able to select by dragging
      zoomType: 'xy'
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
            select: function(e) {
              selectTableCell(this);
            },
            unselect: function(e) {
              selectTableCell(this);
            }
          }
        },
        marker: {
          states: {
            select: {
              fillColor: 'tomato',
              borderColor: 'green'
            }
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
        data: [24916, 24064, 150000, 175000, 132490, 30282, 38121, 40434]
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
  
  // Attach eventListeners for the table cells holding the point values
  attachEventListenerToElements(htmlCollectionToArray(
    document.querySelectorAll('#highcharts-data-table-0 td.number')), 'click',function (e) { 
     updateSelectionOfSeriesPoint(chart, [e.target]); 
  })
  
  // Attach eventListeners for the category table cells
  attachEventListenerToElements(htmlCollectionToArray(
    document.querySelectorAll('#highcharts-data-table-0 th.text[scope=row]')), 'click',function (e) { 
    // create array of related cells for clicked category in the table and toggle selection 
    // for these. Shift removes the first table cell in the table row.
    updateSelectionOfSeriesPoint(chart, htmlCollectionToArray(e.target.parentElement.children).slice(1));
  }) 
  
  // Attach eventListeners for the cells selected by column click
  attachEventListenerToElements(htmlCollectionToArray(
    document.querySelector('#highcharts-data-table-0 tr').children).slice(1), 'click', function (e) { 
    let colCells = getTableCellsForColumn(e.target);
    updateSelectionOfSeriesPoint(chart, colCells);
  })
});