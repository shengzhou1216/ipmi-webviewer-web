<template>
  <div class="app-container">
    <el-alert title="开关机操作略有延迟，必要时需要手动刷新!" type="info" effect="light" show-icon :closable='false'></el-alert>
    <el-alert v-if="isSocketConnected === false" :title="'websocket已断开链接,正在重连...'" type="error" effect="light" show-icon :closable='false'></el-alert>
    <div class="margin-top20 margin-bottom20">
      <el-button type="primary" size="default" @click="scanConfigDialogVisiable = true">扫描设备</el-button>
      <el-button type="primary" size="default" @click="handlePatchctl('on')">批量开机</el-button>
      <el-button type="primary" size="default" @click="handlePatchctl('off')">批量关机</el-button>
    </div>
    <div class="devices">
      <el-row :gutter="20" v-if="devices.length > 0">
        <el-col class="margin-bottom10" :span="8" :offset="0" v-for="(item,key) in devices" :key="key" >
          <device :device="item.fields"></device>
        </el-col>
      </el-row>
      <el-row :gutter="20" v-else>
          加载中<i class="el-icon-loading"></i>
      </el-row>
    </div>
    <el-dialog
      title="IPMI设备扫描"
      :visible.sync="scanConfigDialogVisiable"
      width="30%"
      @close="scanConfigDialogVisiable = false">
      <el-form :model="temp" ref="temp" :rules="rules" label-width="80px" :inline="false" size="normal">
        <el-form-item label="网络号" prop="network">
          <el-input v-model="temp.network" placeholder="请输入网络号"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="scanConfigDialogVisiable = false">取消</el-button>
        <el-button type="primary" @click="handleScanDevices" :loading='scanning'>扫描</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="'批量'+patchStatusLabel"
      :visible.sync="patchctlDialogVisible"
      width="50%"
      @close="patchctlDialogVisible = false">
        <el-table :data="devices" border stripe v-if="devices.length > 0" height="400" @selection-change='handleSelectionChange'>
        <el-table-column
        type="selection"
        width="55">
      </el-table-column>
      <el-table-column
          prop="fields.ip"
          label="IP">
      </el-table-column>
      </el-table>
      <el-form class="margin-top20" :model="temppatch" ref="temppatch" :rules="temppatchrules" label-width="80px" :inline="false" size="normal">
         <el-form-item label="用户名" prop="username">
              <el-input v-model="temppatch.username"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
              <el-input v-model="temppatch.password" type='password'></el-input>
          </el-form-item>
      </el-form>
      <p style="color:red;">若设置用户名和密码，则多台机器使用同一个用户名密码;</p>
      <p style="color:red">若不设置，则使用各机器当前的用户名和密码;</p>
      <span slot="footer">
        <el-button @click="patchctlDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="powerctl_patch" :loading="patchloading">{{patchStatusLabel}}</el-button>
      </span>
    </el-dialog>  
  </div>
</template>

<script>
import Device from '@/components/Device';
import {getDevices,scan,powerctl_patch} from '@/api/device';
import EventBus from '@/event-bus';
export default {
  components: {
    Device,
  },
  name: 'index',
  data() {
    return { 
      scanConfigDialogVisiable: false,
      scanProcessDialogVisiable: false,
      addConfigDialogVisiable: false,
      scanning: false,
      patchctlDialogVisible: false,
      patchStatus: undefined,
      patchloading: false,
      temp: { 
        network: undefined,
      },
      tempDevice: {
        ip: '10.1.35.19',
        network: '10.1.35.19/24',
        username: 'admin',
        password: 'admin',
      },
      rules: {
        network: [
          {required:true,trigger: ['change','blur'],message:'必填项'},
        ],
      },
      availableDevices: [], 
      devices: [],
      socket: null,
      device_socket: null,
      isSocketConnected: undefined,
      patchdevices: [],
      temppatch: {
        username:undefined,
        password: undefined
      },
      temppatchrules: {
         username: [
          ],
          password: [
          ]
      }
    }
  },
  computed:{
    patchStatusLabel(){
      return this.patchStatus === 'on' ? '开机': '关机'
    }
  },
  created() {
    this.init()
    this.temp.ip = '10.1.35.155/24'
    this.temp.netmask = 1
  },
  methods: {
    init(){
      this.getDevices()
      EventBus.$on('refresh',this.getDevices)
      EventBus.$on('scan',this.scan)
    },
    // 扫描设备
    scan(network){
      this.scanning = true;
      scan(network || this.temp.network).then(res => {
        this.devices = res
        this.scanConfigDialogVisiable = false
        this.scanning = false
      }).catch(() => {
        this.scanning = false
      })
    },  
    // 扫描设备
    handleScanDevices(){
      this.$refs['temp'].validate(valid => {
        if(valid){
          this.scan()
        }
      })
    },
   
    getDevices(){
      getDevices().then(res => {
        this.devices = res
      })
    },
    handlePatchctl(status){
      this.patchStatus = status
      this.patchctlDialogVisible = true
    },
    powerctl_patch(){
      this.$refs['temppatch'].validate(valid => {
        if(valid){
          if(this.patchdevices.length <= 0){
            this.$message({
              message: '至少选择一台机器',
              type: 'error',
              showClose: true,
              duration: 3000,
            });
            return
          }
          let temp = {
            ips: this.patchdevices.map(e => e.fields.ip),
            status: this.patchStatus
          }
          let hasUsernamePassword = false
          if(this.temppatch.username && this.temppatch.password){
            hasUsernamePassword = true
            temp.username = this.temppatch.username
            temp.password = this.temppatch.password
          }
          if(!hasUsernamePassword){
            for(let i = 0; i < this.patchdevices.length; i++){
              let device = this.patchdevices[i].fields;
              if(!device.username || !device.password){
                this.$message({
                  message: `IP:${device.ip}还没有设置用户名密码`,
                  type: 'info',
                  showClose: true,
                  duration: 3000,
                });
                return
              }
            }
          }
          this.patchloading = true;
          powerctl_patch(temp).then((res) => {
              let message = ''
              for(let i = 0; i < res.results.length; i++) {
                let r = res.results[i];
                if(!r.result){
                  message += `IP:${r.ip} ${r.message}`
                }
              }
              if(message){
                setTimeout(() => {
                  this.getDevices()
                  this.$message({
                    message: message,
                    type: 'error',
                    showClose: true,
                    duration: 3000,
                  });
                  this.patchloading = false
                  this.patchctlDialogVisible = false
                }, 5000);
              }else{
                setTimeout(() => {
                  this.getDevices()
                  this.$message({
                    message: '操作成功',
                    type: 'success',
                    showClose: true,
                    duration: 3000,
                  });
                  this.patchloading = false
                  this.patchctlDialogVisible = false
                }, 5000);
              }
            }).catch(() => {
              this.patchloading = false
              this.patchctlDialogVisible = false
            })
          }
      })
      
    },
    handleSelectionChange(val) {
        this.patchdevices = val;
    }
  }
}
</script>

<style lang="scss" scoped>
.dailog-no-header ::v-deep .el-dialog__header {
  padding: 0px !important;
}
</style>
