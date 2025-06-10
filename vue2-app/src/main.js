import Vue from "vue";
import App from "./App.vue";
import router from "./router";
// import AvatarPlatform from "./vm-sdk/avatar-sdk-web_3.0.3.1009/index.js";
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
// 导入代码高亮样式
import 'highlight.js/styles/github.css';
// import './css/main.css'
// import './css/demo.css'
// import './css/xiaxue/default.css'
// import './css/xiaxue/normalize.css'
// import './css/xiaxue/weather.css'

// 引入录音诊断工具
import '../diagnose-recorder.js'

Vue.config.productionTip = false;
// Vue.prototype.$AvatarPlatform = AvatarPlatform;
Vue.use(ElementUI);
new Vue({
  router,
  el: '#app',
  render: (h) => h(App),
}).$mount("#app");
