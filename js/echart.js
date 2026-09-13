// 初始化图表（需等待DOM加载完成）
document.addEventListener('DOMContentLoaded', function() {
    // 1. 获取容器
    const chartDom = document.getElementById('chartContainer');
    
    // 2. 初始化ECharts实例
    const myChart = echarts.init(chartDom);

    // 3. 配置项（柱状图核心配置）
    const option = {

        textStyle: {
            color: '#fff',
            fontSize: 14
        },
        xAxis: {
            type: 'category',
            data: ['Com1', 'Com2', 'Com3', 'Com4','Com5', 'Com6', 'Com7'],
            // 坐标轴标签颜色
            axisLabel: { color: '#fff',fontSize: 9 },
            // 坐标轴线颜色
            axisLine: { lineStyle: { color: '#fff' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { color: '#fff',fontSize: 9},
            axisLine: { lineStyle: { color: '#fff' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } } // 分割线半透明
        },
        series: [{
            type: 'bar',
            data: [324, 200, 245, 80, 96, 132, 182],
            // 柱状图填充颜色（白色渐变）
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{
                        offset: 0, color: 'rgba(255,255,255,0.8)'
                    }, {
                        offset: 1, color: 'rgba(255,255,255,0.2)'
                    }]
                }
            }
        }],
        // 提示框样式
        tooltip: {
            backgroundColor: 'rgba(52, 52, 52, 0.7)',
            textStyle: { color: '#fff' },
        },
        // 图表居中配置[18,19](@ref)
        grid: {
            containLabel: true,
            top: '10%',
            bottom: '10%',
            left: '2%',
            right: '2%'
        }
    };

    // 4. 渲染图表
    myChart.setOption(option);

    // 5. 窗口大小自适应
    window.addEventListener('resize', () => {
        myChart.resize();
    });
});


///////折线图示意
document.addEventListener('DOMContentLoaded', function() {
    // 获取ECharts实例
    var myChart2 = echarts.init(document.getElementById('lineChart'));

    // 定义数据
    var years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];

    var seriesData = [
        { name: 'Com1', data: [100, 200, 300, 250, 400, 500, 600] },
        { name: 'Com2', data: [150, 250, 350, 300, 450, 505, 605] },
        { name: 'Com3', data: [102, 202, 302, 207, 150, 230, 350] },
        { name: 'Com4', data: [80, 108, 208, 203, 380, 408, 508] },
        { name: 'Com5', data: [200, 300, 400, 305, 500, 450, 520] },
        { name: 'Com6', data: [50, 105, 205, 200, 350, 405, 505] },
        { name: 'Com7', data: [180, 208, 380, 330, 408, 508, 608] }
    ];

    // 配置 ECharts
    var option = {
        // backgroundColor: '#ffff', // 背景颜色
        // title: {
        //     text: '年度数据趋势',
        //     left: 'center',
        //     textStyle: {
        //         color: '#fff' // 标题颜色
        //     }
        // },
        tooltip: {
            trigger: 'axis',
            textStyle: { color: '#fff' },
            backgroundColor: 'rgba(52, 52, 52, 0.7)',
            borderColor: '#777'
        },
        // legend: {
        //     data: seriesData.map(item => item.name),
        //     textStyle: { color: '#fff' },
        //     fontSize: 6,
        //     top: 10
        // },
        grid: {
            left: '10%', right: '2%', top: '10%', bottom: '15%'
        },
        xAxis: {
            type: 'category',
            data: years,
            axisLine: { lineStyle: { color: '#fff' } },
            axisLabel: { color: '#fff' ,fontSize: 9}
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#fff' } },
            axisLabel: { color: '#fff',fontSize: 9 },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } }
        },
        series: seriesData.map(item => ({
            name: item.name,
            type: 'line',
            data: item.data,
            // smooth: true, // 平滑曲线
            lineStyle: { width: 2 },
            symbolSize: 6
        }))
    };

    // 渲染图表
    myChart2.setOption(option);

    // 监听窗口大小变化，保证图表自适应
    window.addEventListener('resize', function () {
        myChart2.resize();
    });
});

// 容器尺寸变化（flex 布局）时自动重绘
document.addEventListener('DOMContentLoaded', function () {
    if (!window.ResizeObserver) return;
    ['chartContainer', 'lineChart'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        new ResizeObserver(() => {
            const inst = echarts.getInstanceByDom(el);
            if (inst) inst.resize();
        }).observe(el);
    });
});
