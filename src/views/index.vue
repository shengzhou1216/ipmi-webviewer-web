<template>
  <div class="app-container">
    <el-alert v-if="isSocketConnected === false" :title="'websocket已断开链接,正在重连...'" type="error" effect="light" show-icon :closable='false'></el-alert>
    <div class="margin-top20 margin-bottom20">
      <el-button type="primary" size="default" @click="scanConfigDialogVisiable = true">扫描设备</el-button>
      <el-button type="primary" size="default" @click="addConfigDialogVisiable = true">手动添加</el-button>
    </div>
    <div class="devices">
      <device v-for="(item,key) in devices" :key="key" :device="item"></device>
    </div>
    <el-dialog
      title="IPMI设备扫描"
      :visible.sync="scanConfigDialogVisiable"
      width="30%"
      @close="scanConfigDialogVisiable = false">
      <el-form :model="temp" ref="temp" :rules="rules" label-width="80px" :inline="false" size="normal">
        <el-form-item label="本机IP" prop="ip">
          <el-input v-model="temp.ip" placeholder="请输入本机IP地址"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="scanConfigDialogVisiable = false">取消</el-button>
        <el-button type="primary" @click="handleScanDevices">开始扫描</el-button>
      </span>
    </el-dialog>

    <el-dialog
    class="dailog-no-header"
      :visible.sync="scanProcessDialogVisiable"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="50%"
      :show-close='false'
      @close="scanProcessDialogVisiable = false">
      <div class="font-size18 flex justify-content-space-between">
        <p>设备扫描中<i class="el-icon-loading"></i></p>
        <div>
          <p v-if="availableDevices.length <= 0">暂未发现设备</p>
          <p v-if="availableDevices.length > 0">当前发现{{availableDevices.length}}台设备</p>
        </div>
      </div>
      <el-table :data="availableDevices" border stripe v-if="availableDevices.length > 0" height="400">
         <el-table-column
        type="selection"
        width="55">
      </el-table-column>
        <el-table-column
          prop="IP"
          label="IP">
        </el-table-column>
        <el-table-column label='操作'>
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="handleAddDevice(scope.row.IP)">添加</el-button>
            <el-button type="danger" size="mini" @click="handleDeleteDevice(scope.row.IP)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="handleFinishScan" type="warning" size='mini'>结束扫描</el-button>
        <el-button @click="handleAddSelectedDevice" type="primary" size='mini'>添加所选设备</el-button>
        <el-button @click="handleAddAllDevice" type="success" size='mini'>添加所有设备</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="添加设备"
      :visible.sync="addConfigDialogVisiable"
      width="50%"
      @close="addConfigDialogVisiable = false">
      <el-form :model="tempDevice" ref="tempDevice" :rules="rules" label-width="80px" :inline="false" size="normal">
        <el-form-item label="设备IP" prop="ip">
          <el-input v-model="tempDevice.ip" type="text" placeholder="请输入设备IP地址"></el-input>
        </el-form-item>
         <el-form-item label="设备所属网段" prop="network">
          <el-input v-model="tempDevice.network" type="text" placeholder="请输入设备所属网段"></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="tempDevice.username" type="text" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="tempDevice.password" type='password' placeholder="请输入密码"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addConfigDialogVisiable = false">取消</el-button>
        <el-button type="primary" @click="handleAddDevice">添加</el-button>
      </span>
    </el-dialog>
    
  </div>
</template>

<script>
import Device from '@/components/Device';
import {getDevices} from '@/api/device';
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
      temp: { 
        ip: undefined,
      },
      tempDevice: {
        ip: '10.1.35.19',
        network: '10.1.35.19/24',
        username: 'admin',
        password: 'admin',
      },
      rules: {
        ip: [
          {required:true,trigger: ['change','blur'],message:'必填项'},
        ],
        netmask: [
          {required:true,trigger:['change','blur'],message:'必填项'}
        ]
      },
      availableDevices: [], 
      devices: [],
      socket: null,
      device_socket: null,
      isSocketConnected: undefined,
    }
  },
  created() {
    this.init()
    this.temp.ip = '10.1.35.155/24'
    this.temp.netmask = 1
  },
  methods: {
    init(){
      this.intiWs()
      this.getHostInfo()
    },
    // 初始化websocket
    intiWs(){
      // Create WebSocket connection.
      const socket = new WebSocket('ws://127.0.0.1:8000/ws/devices');
      // Connection openedsocket
      socket.addEventListener('open', this.onOpen);
      // Listen for messages
      socket.addEventListener('message', this.onMessage);
      socket.addEventListener('close',this.onClose)
      socket.addEventListener('error',this.onError)
      this.socket = socket
    },
    onOpen(){
      this.isSocketConnected = true;
    },
    onClose(){
      this.isSocketConnected = false
      let _this = this
        setTimeout(function(){
          _this.intiWs()
        },10000)
    },
    onMessage(event){
      console.log('message:',event.data);
      this.handleRawMessage(event.data);
    },
    onError(){
      this.socket.close()
    },
    getHostInfo() {
      // 获取本机的信息。如IP等
    },
    // 扫描设备
    scanDevices(){
        try {
          this.socket.send(JSON.stringify({
            'type': 'scan',
            'data': {
              'ip': this.temp.ip
            }
          }))
          this.scanProcessDialogVisiable = true
        } catch (error) {
          this.scanProcessDialogVisiable = false
        }
    },  
    // 扫描设备
    handleScanDevices(){
      this.$refs['temp'].validate(valid => {
        if(valid){
          this.scanConfigDialogVisiable = false
          this.scanDevices()
        }
      })
    },
    // 扫描到设备
    handleScannedDevice(device){
      this.availableDevices.push(device)
    },
    // 结束扫描
    handleFinishScan(){
      this.$confirm('确定要结束设备扫描吗？', '提示', {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(() => {
         this.socket.send(JSON.stringify({
            'type': 'stop_scan',
          }))
      });
    },
    // 扫描结束
    handleFinishedScan(){
        this.scanProcessDialogVisiable = false;
    },
    // 处理原始消息
    handleRawMessage(message) {
      console.log(message);
      let message_json = JSON.parse(message)
      switch (message_json.type) {
        case 'scan':
          this.handleScanMessage(message_json)
          break;
        case 'add_device':
          this.handleAddDeviceMessage(message_json)  
      }
    },
    // 处理扫描消息
    handleScanMessage(message) {
      switch (message.code) {
        case 200:
          this.handleScannedDevice(message.data)
          break;
        case 201:
          this.handleFinishedScan()
          break;
        default:
          break;
      }
    },
    // 处理添加设备消息
    handleAddDeviceMessage(message){
      if(message.code === 200){
        this.getDevices()
      }
    },
    // 添加一个待定的设备
    handleAddAvailableDevice(){
        
    },
    // 连接一个待定的设备
    handleConnectAvailableDevice(){

    },
    // 添加设备
    handleAddDevice(){
        this.socket.send(JSON.stringify({
          'type': 'add_device',
          'data': this.tempDevice
        }))
    },
    // 添加选择的设备
    handleAddSelectedDevice(){
      
    },
    // 添加所有设备
    handleAddAllDevice(){

    },
    getDevices(){
      getDevices().then(res => {
        this.devices = res
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dailog-no-header ::v-deep .el-dialog__header {
  padding: 0px !important;
}
</style>
