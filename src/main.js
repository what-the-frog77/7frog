import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import CircuitList from './components/CircuitList.vue';
import WorkoutPlayer from './components/WorkoutPlayer.vue';
import Settings from './components/Settings.vue';
import Blank from './components/Blank.vue';

const routes = [
  { path: '/', component: Blank },
  { path: '/7frog', component: CircuitList },
  { path: '/workout/:id', component: WorkoutPlayer, props: true },
  { path: '/settings', component: Settings },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');

