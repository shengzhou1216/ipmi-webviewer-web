<template>
  <div>
      <h1>{{ip}}数据详情(共{{temperatures.length}}个传感器,每{{interval}}s获取一次温度数据)</h1>
      <el-row class="temperature-sensor-list">
            <el-col :span="12" class='temperature-sensor' v-for="(item,key) in temperatures" :key="key">
                <div class="chart">
                    <line-chart :id="''+key" :options="item.options"></line-chart>
                </div>
            </el-col>
      </el-row>
  </div>
</template>

<script>
import {getDeviceTemperature} from '@/api/device'
import LineChart from '@/components/LineChart';
import moment from 'moment'
export default {
    components:{
        LineChart
    },
    data(){
        return {
            ip: undefined,
            temperatures: [],
            timer: null,
            interval:10
        }
    },
    created(){
        if(this.$route.params && this.$route.params.ip){
            this.ip = this.$route.params.ip
            this.getDeviceTemperature()
            // 每5s获取一次温度数据
            this.timer = setInterval(() =>{
                this.getDeviceTemperature()
            },this.interval)
        }
    },
    beforeDestroy(){
        clearInterval(this.timer)
    },
    methods: {
        getDeviceTemperature(){
            getDeviceTemperature(this.ip).then(res => {
                this.temperatures = res.results.map(e => {
                    let xAxisData = e.temperatures.map(t1 => moment(t1.created_at).format('yyyyMMDD-HH:mm:ss'))
                    let seriesData = e.temperatures.map(t2 => {
                        if(t2.temperature.toLowerCase().indexOf("disabled") >= 0){
                            t2.temperature = 'disabled'
                        }else{
                            t2.temperature = t2.temperature.replace('degrees C','').trim()
                        }
                        return t2.temperature
                    })
                    e.options = {
                        title: {
                            text: `${e.name}`,
                            left: 'center',
                        },  
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: {
                                type: 'cross',
                                animation: false,
                                label: {
                                    backgroundColor: '#505765'
                                }
                            }
                        },
                        xAxis: {
                            type: 'category',
                            data: xAxisData
                        },
                        yAxis: {
                            name: '温度(C)',
                            type: 'value',
                            max: 150
                        },
                        series: [{
                            data: seriesData,
                            type: 'line'
                        }]
                    }
                    return e
                })
            })
        }
    }
}
</script>

<style>

</style>