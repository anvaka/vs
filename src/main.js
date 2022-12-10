/**
 * This is the entry point into the application. 
 * 
 * From here I recommend to go to ./lib/buildGraph.js to see how the graph is created
 * or to the ./lib/createRenderer.js that initializes rending process
 */
import {createApp} from 'vue'
import App from './App'

/* eslint-disable no-new */
createApp(App).mount('#app');
// new Vue({
//   el: '#app',
//   components: { App },
//   template: '<App/>'
// })
