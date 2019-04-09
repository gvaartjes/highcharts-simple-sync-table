# highcharts-simple-sync-table
Demo for how to make a bi-directional selection in both chart and a HTML table

# Installation
1. `npm install`
2. `npm start` starts up a local web server fro debugging

# Glitch
Or remix this demo on [Glitch!](https://demo-sync-chart-table-select.glitch.me/) 

# Synchronize selection bi-directionally between chart and table

When is it best to present your data with a chart, or use a table instead? Well, that depends on the audience and how they want to use your data and what message you want to convey.

- *Graphs* work well with presenting a vast amount of data points or when you want to point out the relation between values and the shapes they form. The eye can process fast amounts of information and our brains quickly understand the information or relationships between them.
- *Tables* work well with a lesser amount of data points opposed to graphs. Use tables when your users lookup individual values of points and compare them to other singular points. You can almost see some using his fingers to find the right point in the table. 

Read also this great [article](https://infogram.com/blog/do-you-know-when-to-use-tables-vs-charts/) that explains the differences between presenting data with a chart or table. 

But what if I tell you, that you don't have to choose between visualization with a chart or table? You can have the best of both worlds when you synchronize the selection of data points bidirectionally between chart and table.

In this article, I will show you how to code bidirectional selection between a `<table>` and a [Highcharts](https://www.highcharts.com/products/highcharts) chart.  If a user makes a selection in the table, then it should highlight the data points in the chart, and vice versa, selecting outliers in a chart should highlight the cells in the table. See below for the mockup.

![mockup](/sync-chart-table.png)

## Let's start coding!
I will explain with code snippets how I build the bi-directional selection. The full code you can find in the [highcharts-simple-sync-table](https://github.com/gvaartjes/highcharts-simple-sync-table) repository on GitHub. Find a working demo on [Glitch](https://glitch.com/~highcharts-simple-sync-table) to remix and play with the code!
Highcharts has a nifty feature where it creates an HTML table below the chart with the chart's current data. Enable the `showTable` property for displaying the table. That's convenient, now we don't have to define the table!

```javascript
let chart = Highcharts.chart("container", {
  title: {
    text: "Solar Employment Growth by Sector, 2010-2016"
  },
  
  series: [....],
  
  exporting: {
    showTable: true
  }
}
```

Now we have a table in our page, we can work on building a synch mechanism for bi-directional selection. Let's make a list of what is needed to make this work.

- Select table cell on chart point select
- Select point in the chart on selecting a table cell
- Select multiple points by dragging 
- Select multiple cells by column or row selection
- Set event handlers in the chart for point select and deselect

### Select table cell on point select

```javascript
/**
   * Function for hilighting a table cell corresponding a selected datapoint
   * in the chart 
   * @param {Point} point, Highcharts.Point 
   * @param {Boolean} selected, Is the point selected or deselected?
   */
  const selectTableCell = function (point, highlight) {
    // check the glo al properties, initially not set
    vHeaders = vHeaders ? vHeaders : getVHeaders();
    hHeaders = hHeaders ? hHeaders : getHHeaders();

    // find corresponding cell for datapoint
    let cell = getCell(vHeaders.indexOf(point.category),
      hHeaders.indexOf(point.series.name));

    // remove or add the classname on the element to select/deselect the tablecell
    DOMTokenList.prototype[highlight ? 'add' : 'remove']
      .apply(cell.classList, ['selected']);
  };
```

The above function takes a Highcharts point and a selection state: `true` for select table cell and `false` for unselect. It then locates the associated cell by looking up the horizontal and vertical indexes of the cell. We can find those easily because there is a direct relation between the vertical headers of the table (`vHeaders`) and the `point.category ` as there is a relation between the horizontal headers (`hHeaders`) and the series name of the point (`point.series.name`).

### Select point in the chart on selecting a table cell

```javascript
/**
  * Update the data point in the series on selecting or deselecting a table cell
  * @param {Chart} chart 
  * @param {Array} tableCellArr 
  */
const updateSelectionOfSeriesPoint = (chart, tableCellArr) => {
  tableCellArr.forEach((cell) => {
    let cellIdx = cell.cellIndex;
    let point = chart.series[cellIdx - 1].points[cell.parentNode.rowIndex - 1];
    // contains classList selected, then deselect point and v.v.
    point.select(!cell.classList.contains('selected'), true);
  })
}
```

Vice versa the previous function (`selectTableCell`) , there's also a mapping between the cell index for retrieving the linked series in the chart. Then we use the row index for getting the index of the point in the series. 

```javascript
let point = chart.series[cellIdx - 1].points[cell.parentNode.rowIndex - 1];
```

When we have the point, we will flip the selected state of it with the code snippet below.

```javascript
point.select(!cell.classList.contains('selected'), true);
```

The second parameter of `point.select()` is set to `true`, so the selection is added to other selected points. See also the [Highcharts API](https://api.highcharts.com/class-reference/Highcharts.Point.html#select). We need that in order to support multiple selections of points in the demo.

### Select multiple points by dragging

Ok, this going to be a little bit counterintuitive..., to support the selection of points we're using the Highcharts zooming capabilities and the event it fires when an area of the chart has been selected to zoom in to. Selection is enabled by setting the chart's zoomType (`zoomType: 'xy'`). 

```javascript
let chart = Highcharts.chart("container", {
  chart: {
        events: {
          selection: selectPointsByDrag,
          click: unselectByClick
        },
        // necesssary to be able to select by dragging
        zoomType: 'xy'
     }, ....
});
```

One parameter, event, is passed to the `selectPointsByDrag` function, containing event information. The default action for the selection event is to zoom the chart to the selected area. We prevent zooming in by calling event.preventDefault().
Information on the selected area can be found through event.xAxis and event.yAxis, which are arrays containing the axes of each dimension and each axis' min and max values. See the implementation of the function here below, where we then check which points of all series in the chart are within the selected area.

```javascript
/**
   * selected area in chart is used to filter which series points fall within the selected area
   * Normally used to zoom in, but we return false to prevent that happening
   * @param {Event} e
   */
  function selectPointsByDrag(e) {
    // Select points
    Highcharts.each(this.series, function (series) {
      Highcharts.each(series.points, function (point) {
        if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
          point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
          point.select(true, true);
        }
      });
    });

    return false; // Don't zoom
  }
```

### Select multiple cells by column or row selection

It would be a quite nifty feature, to be able to select table cells by clicking on the row or column. We already have the `updateSelectionOfSeriesPoint = (chart, tableCellArr) => {}` function that takes an array of table cells for updating the selection state of the points in the chart. Attach eventListeners to the row and column header cells for selecting the cells and then pass them to the `updateSelectionOfSeriesPoint` function. See snippet below.

```javascript
// Attach eventListeners for the table cells holding the point values
attachEventListenerToElements(htmlCollectionToArray(
  document.querySelectorAll('#highcharts-data-table-0 td.number')), 'click', function (e) {
        updateSelectionOfSeriesPoint(chart, [e.target]);
   })
```

Note in the snippet above, two utility functions for convenience: `attachEventListenerToElements` that attaches events to an array of html elements, 

```javascript
// attach eventlistener to array of HTML elements
  const attachEventListenerToElements = (elementsArr, eventName, listener) => {
    elementsArr.forEach(elem => elem.addEventListener(eventName, listener))
  }
```

and `htmlCollectionToArray` for turning a HTMLCollection into an Array and use `forEach` when looping over the table cells.

```javascript
const htmlCollectionToArray = (nodes) => Array.prototype.slice.call(nodes);
```

### Set eventHandlers in the chart for point select and deselect

The last thing we have to do, is to hook up the events for [selecting](https://api.highcharts.com/highcharts/plotOptions.line.point.events.select) and unselecting points in the chart for triggering the `selectTableCell` which selects or unselect the corresponding table cell.

```javascript
plotOptions: {
  series: {
    point: {
      events: {
        select: function (e) {
          selectTableCell(this, true);
        },
        unselect: function (e) {
          selectTableCell(this, false);
        }
      }
    }
  }
}
```

## Done!

With this article, I demonstrated how to set up bi-directional selection with Highcharts. It's a proof of concept that surely can be improved. For example, the row and column selection in the table isn't that optimal. It inverts the already selected cells, instead of adding the unselected cells to the selected cells. Nevertheless, I hope you get inspired by this demo and build your own solution!