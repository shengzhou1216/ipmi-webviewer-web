<template>
  <div :id="chartId" style="width: 600px;height:400px;"></div>
</template>

<script>
const echarts = require('echarts')
export default {
    props: {
        id: {
            type: String,
            required: true
        },
        options: {
            type: Object,
            required: true
        }
    },
    computed:{
        chartId(){
            return this.id + '-line'
        }
    },
    data(){
        return {
            chart: null
        }
    },
    watch:{
        options(val){
            this.chart.setOption(val)
        }
    },
    mounted() {
        this.chart = echarts.init(document.getElementById(this.chartId))
        this.chart.setOption(this.options)
    }
}
</script>

<style>

</style>