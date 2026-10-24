/* All summary and plot values derive from the same synthetic score series. */
document.addEventListener('DOMContentLoaded', () => {
    const scores = [51, 59, 60, 64, 70];
    const latest = scores.at(-1);
    const grade = latest >= 80 ? 'GOOD' : latest >= 60 ? 'FAIR' : 'POOR';
    document.getElementById('health-latest').textContent = String(latest);
    document.getElementById('health-grade').textContent = grade;
    const host = document.getElementById('health-chart');
    const chart = echarts.init(host);
    chart.setOption({
        animation: false,
        tooltip: {trigger: 'axis', valueFormatter: value => `${value} / 100 (synthetic)`},
        grid: {left: '10%', right: '7%', top: '8%', bottom: '17%'},
        xAxis: {type: 'category', boundaryGap: false, data: ['NOV\n2024', 'DEC\n2024', 'JAN\n2025', 'FEB\n2025', 'MAR\n2025'], axisTick: {show: false}, axisLine: {show: false}, axisLabel: {interval: 0, color: '#333', margin: 5}},
        yAxis: {type: 'value', min: 0, max: 100, interval: 50, axisLabel: {color: '#555'}, splitLine: {lineStyle: {color: '#eee'}}},
        series: [{type: 'line', data: scores, symbolSize: 6, lineStyle: {color: '#40c2e4', width: 2},
            itemStyle: {color: '#40c2e4', borderColor: '#614392', borderWidth: 1},
            areaStyle: {color: '#70d3ea', opacity: 0.7}, label: {show: true, color: '#614392', position: 'top'}}]
    });
    function resize() {
        if (!host.clientWidth || !host.clientHeight) return;
        chart.resize();
        const fontSize = Math.max(8, Math.min(13, host.clientWidth / 36));
        chart.setOption({xAxis: {axisLabel: {fontSize}}, yAxis: {axisLabel: {fontSize}}, series: [{label: {fontSize}}]});
    }
    new ResizeObserver(resize).observe(host);
    resize();
});
