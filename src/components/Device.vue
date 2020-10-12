<template>
  <el-card class="device">
      <div></div>
      <p>{{device.ip}}</p>
      <div slot='footer'></div>
  </el-card>
</template>

<script>
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

        }
    },
    methods: {

    }
}
</script>

<style>

</style>