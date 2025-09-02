fetch("data.json")
    .then(res => res.json())
    .then(data => initCharts(data));

function initCharts(dataset) {
    let mapChart = echarts.init(document.getElementById("map"));
    let lineChart = echarts.init(document.getElementById("line"));

    let currentMetric = "EXP";
    let selectedCountry = null;
    let currentYear = 2025;


    function getMapData(metric, year = currentYear) {
        let yearData = dataset[metric][year] || [];
        return yearData.map(d => ({
            name: d.name,
            value: d.us_value / 1e9
        }));
    }

    function getLineData(metric, country) {
        let years = Object.keys(dataset[metric]).sort();
        let values = years.map(y => {
            let record = dataset[metric][y].find(d => d.name === country);
            return record ? record.us_value / 1e9 : 0;
        });
        return { years, values };
    }

    function formatNumber(num) {
        return num.toFixed(1).replace(".", ",");
    }

    function updateLine(country) {
        let exp = getLineData("EXP", country);
        let imp = getLineData("IMP", country);
        let bal = getLineData("BAL", country);

        let option = {
            title: { text: `Totais por ano (${country})`, left: "center", top: 5 },
            tooltip: {
                trigger: "axis",
                formatter: params => {
                    let year = params[0].axisValue;
                    let lines = [`Ano ${year}`];
                    params.forEach(p => {
                        let label = "";
                        if (p.seriesName === "Exportações") {
                            label = `Total de Exportações ${country}: US$ ${formatNumber(p.data)} bi`;
                        } else if (p.seriesName === "Importações") {
                            label = `Total de Importações ${country}: US$ ${formatNumber(p.data)} bi`;
                        } else {
                            label = `Total de Balança Comercial ${country}: US$ ${formatNumber(p.data)} bi`;
                        }
                        lines.push(label);
                    });
                    return lines.join("<br/>");
                }
            },
            legend: { data: ["Exportações", "Importações", "Balança Comercial"], top: 50 },
            grid: { left: "10%", right: "10%", bottom: "15%", top: 90 },
            xAxis: { type: "category", data: exp.years },
            yAxis: { type: "value", name: "Bilhões US$" },
            dataZoom: [
                { type: "inside", start: 0, end: 100 },
                { type: "slider", start: 0, end: 100, showDataShadow: false }
            ],
            series: [
                { name: "Exportações", type: "line", smooth: true, data: exp.values },
                { name: "Importações", type: "line", smooth: true, data: imp.values },
                { name: "Balança Comercial", type: "line", smooth: true, data: bal.values }
            ]
        };
        lineChart.setOption(option);
    }

    function updateMap() {
        let dataForYear = getMapData(currentMetric, currentYear);
        let maxValue = Math.max(...dataForYear.map(d => d.value).filter(v => v !== undefined));

        let colorScale;
        if (currentMetric === "EXP") {
            colorScale = ['#e0f3db', '#43a2ca', '#006837'];
        } else if (currentMetric === "IMP") {
            colorScale = ['#fee0d2', '#fc9272', '#cb181d']; 
        } else {
            colorScale = ['#cb181d', '#f7f7f7', '#2171b5']; 
        }

        let mapOption = {
            title: {
                text: `Volume de ${currentMetric === "EXP" ? "Exportações" : currentMetric === "IMP" ? "Importações" : "Balança Comercial"} (${currentYear})`,
                subtext: "Dados do monitor do comércio brasileiro",
                left: "center"
            },
            tooltip: {
                trigger: "item",
                formatter: p => `${p.name}<br/>US$ ${p.value ? formatNumber(p.value) : "0,0"} bi`
            },
            visualMap: {
                min: currentMetric === "BAL" ? -maxValue : 0,
                max: maxValue,
                right: 20,
                top: "middle",
                text: ["Alto", "Baixo"],
                calculable: true,
                orient: "vertical",
                name: "Volume negociado com o país (Bilhões de US$)",
                inRange: { color: colorScale }
            },
            series: [{
                name: "Mapa",
                type: "map",
                map: "world",
                roam: true,
                emphasis: { label: { show: false } },
                itemStyle: {
                    normal: { areaColor: "#f5f5f5", borderColor: "#999" },
                    emphasis: { areaColor: "#d1e6fa" }
                },
                data: dataForYear
            }]
        };
        mapChart.setOption(mapOption);
    }

    updateMap();


    mapChart.on("click", params => {
        selectedCountry = params.name;
        updateLine(selectedCountry);
    });

    document.getElementById("metric").addEventListener("change", e => {
        currentMetric = e.target.value;
        updateMap();
    });
}
