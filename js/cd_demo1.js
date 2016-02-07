// wider scope for these charts so that we can reference them from the reset and filter utility functions
var totalNumber;
var uniqueNumber;
var divisionPieChart;
var departmentRowChart;
var planningunitRowChart;
var roleRowChart;
var nameRowChart;
var demoDateBarChart;

var appropriationTypeColors =
    ["#9e9ac8",
     "#bcbddc", // light green 
    "#007BA7"]; // blue

var rolesColors =
    [
     "#aec7e8", // light blue 
    "#1f77b4", // dark blue
    "#ffbb78" //  orange 
    ]; 

// load the data file
d3.csv("data/cd_demo_all.csv", function (data) {
    
    // associate the charts with their html elements
    totalNumber = dc.numberDisplay("#dc-chart-total");
    uniqueNumber = dc.numberDisplay("#dc-chart-unique");
	divisionPieChart = dc.pieChart("#dc-chart-division");
	departmentRowChart = dc.rowChart("#dc-chart-department");
	planningunitRowChart = dc.rowChart("#dc-chart-planningunit");
	rolePieChart = dc.pieChart("#dc-chart-role");
	nameRowChart = dc.rowChart("#dc-chart-name");
    demoDateBarChart = dc.barChart("#dc-chart-demoDate");
    
    /*data.forEach(function (d) {
        d.count = 1; // add column "count", set value to "1"
    });
    // put data in crossfilter
    var facts = crossfilter(data);

     // 01 group for grand total 
    var totalGroup = facts.groupAll().reduceSum(dc.pluck("count"));

    // 01 display grand total
    totalNumber
        .group(totalGroup)
        .valueAccessor(function (d) {
            //console.log(d.Participants);
            return d.count;
        })
        .formatNumber(function (d) { return d + " scans"; });  */
    
    var dateFormat = d3.time.format("%Y-%m-%dT%H:%MZ");
    
    data.forEach(function (d) {
        d.count = 1; // add column "count", set value to "1"
        
        // rewrite time with the javascript Time object
        d.Time = dateFormat.parse(d.Time);
        
        // set date as a the initial index (2016.1). TODO: remove the need of this field
        //d.Date = "" + d.Time.getFullYear() + "." + d.Time.getMonth();
    });
    // put data in crossfilter
    var facts = crossfilter(data);

    var updateUnique = function (unique, key, increment) {
	    var value = unique["" + key];

	    // not initialized
	    if (typeof value === 'undefined')
		value = 0;

	    // update with increment
	    if (value + increment > 0) {
		unique["" + key] = value + increment;
	    } else {
		delete unique["" + key];
	    }
	}

    // group for grand total number of attendees
    var totalGroup = facts.groupAll().reduce(
        function (p, v) { // add finction
            ++p.count;
            updateUnique(p.uAttendees, v["Participants"], 1);
	    return p;
        },
        function (p, v) { // subtract function
            --p.count;
            updateUnique(p.uAttendees, v["Participants"], -1);
            return p;
        },
        function () {
            return {
                count: 0,
                uAttendees: {} // unique Attendees
            }
        } // initial function
    );

    // 01 display grand total
    totalNumber
        .group(totalGroup)
        .valueAccessor(function (d) {
            return d.count;
        })
        .formatNumber(function (d) { return d + " attendees"; });

    // 02 display grand total
    uniqueNumber
        .group(totalGroup)
        .valueAccessor(function (d) {
            var keys = 0;
            for (k in d.uAttendees) ++keys;
	    return keys;
        })
        //.formatNumber(function (d) { return Math.round(d) + " attendees"; });
        .formatNumber(function (d) { return d + " unique person"; });

    
    // 03 dimension, rowchart, division
    var divisionDim = facts.dimension(dc.pluck('Division'));
    var divisionGroupSum = divisionDim.group().reduceSum(dc.pluck("count"));
    
    divisionPieChart
        .dimension(divisionDim)
        .group(divisionGroupSum)
        .width(200)
        .height(200)
        .radius(80)
        .ordinalColors(appropriationTypeColors);

    // 04 dimension and group for demo date
//    var demoDateDim = facts.dimension(dc.pluck('Date'));
    var demoDateDim = facts.dimension(function(d) { return d3.time.day(d.Time);});
    var demoDateGroupSum = demoDateDim.group().reduce(
        function (p, v) { // add function
              p[v.Division] += v.count;
              return p;
          },
        function (p, v) { // subtract function
            p[v.Division] -= v.count;
            return p;
        },
        function () { // initial function
            return { "IT": 0, "OPS": 0};
        }
    );

    // 05 stacked bar chart for days w/appropriation types  
    demoDateBarChart
        .dimension(demoDateDim)
        .group(demoDateGroupSum, "IT").valueAccessor(function (d) { return d.value.IT; })
        .stack(demoDateGroupSum, "OPS", function (d) { return d.value.OPS; })
        .width(650)
        .height(200).margins({ top: 10, right: 30, bottom: 20, left: 50 })
        .legend(dc.legend().x(60).y(20))
        .gap(200)  // space between bars
        //.centerBar(true)
        //.x(d3.scale.linear().domain([2014.2, 2017], .1))
        .x(d3.time.scale().domain(d3.extent(data, function(d) { return d3.time.day.round(d.Time) })))
        .xUnits(d3.time.days)
        //.xUnits(dc.units.ordinal)
        //.elasticY(true)
        .ordinalColors(appropriationTypeColors)
        .xAxis().ticks(d3.time.days, 7).tickFormat(d3.time.format("%b%e"));

    demoDateBarChart.yAxis().tickFormat(function (v) { return v + " ppl"; });
       
    
    // 04 dimension, rowchart, department_TYPE  
    var departmentTypeDim = facts.dimension(dc.pluck('Department'));
    var departmentTypeGroupSum = departmentTypeDim.group().reduceSum(dc.pluck("count"));
    
    departmentRowChart
        .dimension(departmentTypeDim)
        .group(departmentTypeGroupSum)
        .data(function (d) { return d.top(15); })
        .width(300)
        .height(330)
        //.height(15 * 22)
        .margins({ top: 0, right: 10, bottom: 20, left: 20 })
        .elasticX(true)
        .ordinalColors(['#c5b0d5']) // light blue
        //.colors(d3.scale.category20())
        .labelOffsetX(0)
        .xAxis().ticks(5).tickFormat(d3.format("d"));
    
    // 05 dimension, rowchart, BUSINESS_FOCUS  
    var planningunitDim = facts.dimension(dc.pluck('Planning Unit'));
    var planningunitGroupSum = planningunitDim.group().reduceSum(dc.pluck("count"));
    
    planningunitRowChart
        .dimension(planningunitDim)
        .group(planningunitGroupSum)
        .data(function (d) { return d.top(15); })
        .width(300)
        .height(330)
        //.height(15 * 22)
        .margins({ top: 0, right: 10, bottom: 20, left: 20 })
        .elasticX(true)
        //.ordinalColors(['#c5b0d5']) // light purple
        .colors(d3.scale.category20())
        .labelOffsetX(0)
        .xAxis().ticks(4).tickFormat(d3.format("d"));
    
    // 06 dimension, rowchart, role  
    var roleDim = facts.dimension(dc.pluck('Role'));
    var nameRoles = d3.map(data.reduce(function(o, v, i) {
        o[v.Participants] = v.Role;
        return o;
    }, {}));

    var roleGroupSum = roleDim.group().reduceSum(dc.pluck("count"));

    var roles = roleGroupSum.top(Infinity).map(function(d) {return d.key; });
    var rolesNumber = d3.map(roles.reduce(function(old, value, index) {
        old[value] = index;
        console.log("what's the index value:", old)
        return old;
    }, {}));
    //var rolesColors = d3.scale.category20();
    var rolesColors = d3.scale.ordinal().range(["#ffbb78", "#aec7e8", "#e7cb94"]);
    //var rolesColors = roleTypeColors;
    
    rolePieChart
        .dimension(roleDim)
        .group(roleGroupSum)
        .width(200)
        .height(200)
        .radius(80)
        .colors(rolesColors)
        .colorAccessor(function(d){
            console.log("what's the returned index value:", rolesNumber.get(d.key));
            return rolesNumber.get(d.key);
        })
        .innerRadius(50);
    
    // 07 dimension, rowchart, participants  
    var nameDim = facts.dimension(dc.pluck('Participants'));
    var nameGroupSum = nameDim.group().reduceSum(dc.pluck("count"));
    nameRowChart
        .dimension(nameDim)
        .group(nameGroupSum)
        .width(250)
        .height(830)
        .margins({ top: 0, right: 5, bottom: 20, left: 20 })
        .elasticX(true)
        .colors(rolesColors)
        .colorAccessor(function(d){
            console.log("what's the returned name value:", rolesNumber.get( nameRoles.get(d.key)));
            return rolesNumber.get( nameRoles.get(d.key) );
        })
        .labelOffsetX(0)
        .xAxis().ticks(1).tickFormat(d3.format("d"));

    dc.renderAll();
});


