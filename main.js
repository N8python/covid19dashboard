Chart.scaleService.updateScaleDefaults('logarithmic', {
    ticks: {
        callback: function(tick, index, ticks) {
            if (Math.log10(tick) % 1 === 0) {
                return tick.toLocaleString()
            }
            return "";
        }
    }
});
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const deltaCanvas = document.getElementById("deltaCanvas");
const deltaCtx = deltaCanvas.getContext("2d");
const countries = document.getElementById("country");
const days = document.getElementById("days");
const covidRes = document.getElementById("covidRes");
const covidAmt = document.getElementById("covidAmt");
const daysRes = document.getElementById("daysRes");
let chart;
let deltaChart;
let globalData;
const avg = arr => arr.reduce((t, v) => t + v) / arr.length;

function extract({
    key,
    data,
    first,
    second
}) {
    const lists = Object.entries(data).filter(([country]) => countries.value === "World" ? true : country === countries.value).map(([_, country]) => country.map(day => day[key]));
    const list = Array(lists[0].length).fill(undefined).map((_, i) => lists.map(country => country[i]).reduce((t, v) => t + v)).filter(num => !Number.isNaN(num));
    const { equation } = regression.exponential(list.map((x, i) => [i, x]));
    const [a, b] = equation;
    return {
        a,
        b,
        [key]: list,
        data: [{
            label: first.label,
            data: list,
            fill: false,
            borderColor: first.color,
            lineTension: 0.1
        }, {
            label: second.label,
            data: list.map((_, i) => Math.round(a * Math.exp(b * i))),
            fill: false,
            borderColor: second.color,
            lineTension: 0.1,
            hidden: true
        }]
    }


}

function extractDelta({
    key,
    data,
    label,
    color
}) {
    const lists = Object.entries(data).filter(([country]) => countries.value === "World" ? true : country === countries.value).map(([_, country]) => country.map(day => day[key]));
    const list = Array(lists[0].length).fill(undefined).map((_, i) => lists.map(country => country[i]).reduce((t, v) => t + v)).filter(num => !Number.isNaN(num));
    const deltas = list.slice(1).map((item, i) => item - list[i]);
    return {
        label,
        data: deltas,
        fill: false,
        borderColor: color,
        lineTension: 0.1
    };
}

function getDates(data) {
    return Object.values(data)[0].map(day => day.date);
}

function getLabel(tooltipItem, datasets) {
    return `${datasets[tooltipItem.datasetIndex].label}:${format(tooltipItem.value)}`;
}

function renderChart(data) {
    const confirmed = extract({
        key: "confirmed",
        data,
        first: {
            label: "Total Cases",
            color: "rgb(75, 192, 192)"
        },
        second: {
            label: "Projected Cases",
            color: "rgb(0, 255, 255)"
        }
    });
    const deaths = extract({
        key: "deaths",
        data,
        first: {
            label: "Total Deaths",
            color: "rgb(192, 0, 75)"
        },
        second: {
            label: "Projected Deaths",
            color: "rgb(255, 0, 0)"
        }
    });
    const recovered = extract({
        key: "recovered",
        data,
        first: {
            label: "Total Recovered",
            color: "rgb(75, 192, 0)"
        },
        second: {
            label: "Projected Recovered",
            color: "rgb(0, 255, 0)"
        }
    })
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: getDates(data),
            datasets: [...confirmed.data, ...deaths.data, ...recovered.data]
        },
        options: {
            tooltips: {
                callbacks: {
                    label(tooltipItem, data) {
                        return getLabel(tooltipItem, data.datasets)
                    }
                }
            }
        }
        /*,
                options: {
                    scales: {
                        yAxes: [{
                            type: "logarithmic"
                        }]
                    }
                }*/
    })
}

function renderDeltaChart(data) {
    deltaChart = new Chart(deltaCtx, {
        type: "line",
        data: {
            labels: getDates(data),
            datasets: [extractDelta({
                key: "confirmed",
                data,
                label: "Confirmed Cases Daily Change",
                color: "rgb(75, 192, 192)"
            }), extractDelta({
                key: "deaths",
                data,
                label: "Deaths Daily Change",
                color: "rgb(255, 0, 0)"
            }), extractDelta({
                key: "recovered",
                data,
                label: "Recovered Daily Change",
                color: "rgb(0, 255, 0)"
            })]
        },
        options: {
            tooltips: {
                callbacks: {
                    label(tooltipItem, data) {
                        return getLabel(tooltipItem, data.datasets)
                    }
                }
            }
        }
    })
}
let a = 0;
let b = 0;
async function main() {
    const json = await fetch("https://pomber.github.io/covid19/timeseries.json");
    const data = await json.json();
    /*const confirmed = Array(100).fill(undefined).map((_, i) => confirmedLists.map(country => country[i]).reduce((t, v) => t + v)).filter(num => !Number.isNaN(num));
    const { equation } = regression.exponential(confirmed.map((x, i) => [i, x]));
    const [a, b] = equation;*/
    globalData = data;
    Object.keys(data).forEach(country => {
        countries.innerHTML += `<option>${country}</option>`
    })
    renderChart(data);
    renderDeltaChart(data);
    const confirmed = extract({
        key: "confirmed",
        data,
        first: {
            label: "Total Cases",
            color: "rgb(75, 192, 192)"
        },
        second: {
            label: "Projected Cases",
            color: "rgb(0, 255, 255)"
        }
    });
    a = confirmed.a;
    b = confirmed.b;
}
main();
let logarithmOn = false;
document.getElementById("log").onclick = () => {
    if (!logarithmOn) {
        logarithmOn = true;
        chart.options.scales.yAxes = [{
            type: "logarithmic"
        }]
        deltaChart.options.scales.yAxes = [{
            type: "logarithmic"
        }]
        chart.update();
        deltaChart.update();
    } else {
        logarithmOn = false;
        chart.options.scales.yAxes = [{}];
        deltaChart.options.scales.yAxes = [{}];
        chart.update();
        deltaChart.update();
    }
}
let projectionsHidden = true;
document.getElementById("hide").onclick = () => {
    if (countries.value === "World") {
        if (!projectionsHidden) {
            projectionsHidden = true;
            chart.data.datasets[1].hidden = true;
            chart.data.datasets[3].hidden = true;
            chart.data.datasets[5].hidden = true;
            chart.update();
        } else {
            projectionsHidden = false;
            chart.data.datasets[1].hidden = false;
            chart.data.datasets[3].hidden = false;
            chart.data.datasets[5].hidden = false;
            chart.update();
        }
    }
}
countries.onchange = () => {
    chart.destroy();
    deltaChart.destroy();
    renderChart(globalData);
    renderDeltaChart(globalData);
    if (countries.value !== "World") {
        projectionsHidden = true;
        chart.data.datasets[1].hidden = true;
        chart.data.datasets[3].hidden = true;
        chart.data.datasets[5].hidden = true;
        chart.update();
        document.getElementById("hide").setAttribute("disabled", "true");
    } else {
        document.getElementById("hide").removeAttribute("disabled");
    }
}
setInterval(() => {
    if (chart) {
        const currentDays = chart.data.datasets[0].data.length - 1;
        covidRes.innerHTML = format(Math.round(a * Math.exp(b * (Number(days.value) + currentDays))));
        if (covidAmt.value) {
            daysRes.innerHTML = Math.round(((Math.log(parseNum(covidAmt.value) / a) / b) - currentDays)) + " Days";
        }
    }
}, 30)