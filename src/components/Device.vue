<template>
 <div>
      <el-card class="device flex justify-content-flex-start">
      <div>电源:
        <el-popover
            v-if="mydevice.is_up.toLowerCase() === 'true'"
            placement="top"
            width="160"
            v-model="visible"
            >
            <p>确定关机吗？</p>
            <div style="text-align: right; margin: 0">
                <el-button size="mini" type="text" @click="visible = false">否</el-button>
                <el-button type="primary" size="mini" @click="handlePoweroff()">是</el-button>
            </div>
            <el-button slot="reference" size="mini" type="success" :loading="poweroffing" >{{poweroffing ? '关机中' : '已开机'}}</el-button>
        </el-popover>
         <el-popover
           v-else-if="mydevice.is_up.toLowerCase() === 'false'"
            placement="top"
            width="160"
            v-model="visible"
            >
            <p>确定开机吗？</p>
            <div style="text-align: right; margin: 0">
                <el-button size="mini" type="text" @click="visible = false">否</el-button>
                <el-button type="primary" size="mini" @click="handlePoweron()">是</el-button>
            </div>
            <el-button slot="reference" size="mini" :loading='poweroning' type="danger">{{poweroning ? '开机中' : '已关机'}}</el-button>
        </el-popover>
        <el-tag type="warning" v-else size="normal"  effect="dark" :closable="false" @click="handleViewPowerstatus">查看电源状态</el-tag>
      </div>
      <div>IP:{{mydevice.ip}}</div>
      <div>MAC:{{mydevice.mac | emptyFilter}}</div>
      <div>
          <el-button :type="hasUsernamePassword  ? 'warning' : 'primary'" size="default" @click="handleSetCredentials">
              {{hasUsernamePassword ? '修改' : '设置'}}用户名密码
          </el-button>
          <el-button type="primary" size="default" @click="handleViewInfo">详情</el-button>
      </div>
  </el-card>
  <el-dialog
      title="输入用户名密码"
      :visible.sync="userInfoDialogVisiable"
      width="30%"
      @close="userInfoDialogVisiable = false">
      <el-form :model="temp" ref="temp" :rules="rules" label-width="80px" :inline="false" size="normal">
          <el-form-item label="IP">
              <el-input v-model="temp.ip" disabled></el-input>  
          </el-form-item>
          <el-form-item label="用户名" prop='username'>
              <el-input v-model="temp.username"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
              <el-input v-model="temp.password" type='password'></el-input>
          </el-form-item>
      </el-form>
      <span slot="footer">
          <el-button @click="userInfoDialogVisiable = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit()">确定</el-button>
      </span>
  </el-dialog>
 </div>
</template>

<script>
import {powerctl,getPowerStatus,updateUsernameAndPassword} from '@/api/device'
import EventBus from '@/event-bus'
export default {
    name: 'Device',
    props: {
        device: {
            type: Object,
            required: true, 
            default: () => {}
        }
    },
    data() {
        return {
            visible: false,
            userInfoDialogVisiable : false,
            poweroffing: false,
            poweroning: false,
            action: undefined,
            temp: {
                ip: undefined,
                username: undefined,
                password: undefined
            },
            rules: {
                username: [
                    {required:true,trigger:['blur','change'],message:'必填项'}
                ],
                password: [
                    {required:true,trigger:['blur','change'],message:'必填项'}
                ]
            }
        }
    },
    computed:{
        hasUsernamePassword(){
            return this.device.username && this.device.password
        },
        mydevice(){
            return this.device
        }
    },
    methods: {
        handlePoweroff(){
            this.visible = false
            if (!this.checkCredentials()) return
            this.poweroffing = true
            powerctl({
                ip: this.device.ip,
                status:'off',
            }).then(() => {
                setTimeout(() => {
                    this.poweroffing = false
                    EventBus.$emit("refresh")
                    this.$message({
                        message: '关机成功',
                        type: 'success',
                        showClose: true,
                        duration: 3000,
                    });
                }, 5000);
            }).catch(() => {
                this.poweroffing = false
            })
        },
        handlePoweron(){
            this.visible = false
            if (!this.checkCredentials()) return
            this.poweroning = true
            powerctl({
                ip: this.device.ip,
                status:'on',
            }).then(() => {
                setTimeout(() => {
                    this.poweroning = false
                    EventBus.$emit("refresh")
                    this.$message({
                        message: '开机成功',
                        type: 'success',
                        showClose: true,
                        duration: 3000,
                    });
                }, 5000);
            })
        },
        handleSetCredentials(){
            this.userInfoDialogVisiable = true
            this.temp.ip = this.device.ip
        },
        handleSubmit(){
            this.$refs['temp'].validate(valid => {
                if(valid){
                    updateUsernameAndPassword(this.temp).then(() => {
                        this.userInfoDialogVisiable = false
                        this.$message({
                            message: '设置成功',
                            type: 'success',
                            showClose: true,
                            duration: 3000,
                        });
                        EventBus.$emit("refresh")
                    })
                }
            })
        },
        handleViewPowerstatus(){
            if (!this.checkCredentials()) return
            getPowerStatus({
                ip:this.device.ip,
            }).then(() => {
                EventBus.$emit("refresh")
            })
        },
        checkCredentials(){
            if(!this.hasUsernamePassword){
                this.userInfoDialogVisiable = true
                this.temp.ip = this.device.ip
                return false
            }
            return true
        },
        handleViewInfo(){
            if (!this.checkCredentials()) return
            let routeData = this.$router.resolve({path: `/${this.device.ip}/info`});
            window.open(routeData.href, '_blank');
        }
    }
}
</script>

<style lang='scss'>
.device{
    div {
        text-align: left;
        padding: 5px;
    }
}
</style>