/**
 * This is the entry point into the application. 
 * 
 * From here I recommend to go to ./lib/buildGraph.js to see how the graph is created
 * or to the ./lib/createRenderer.js that initializes rending process
 */
import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
