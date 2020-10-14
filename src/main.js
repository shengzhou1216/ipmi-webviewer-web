import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import '@/styles/index.scss' // global css


Vue.use(ElementUI)

Vue.config.productionTip = false

Vue.filter('emptyFilter',(value)=>{
  if(!value || value === ''){
    return '无'
  }
  return value
})
new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
