<script setup>
import { reactive, provide, onMounted } from 'vue';

// Simple reactive store for global state
const store = reactive({
  workout_length: 30,	// Base exercise duration in seconds
  pause_length: 6,	// "Get ready" countdown duration
  warmups: true,	// Whether to include warm-up/cool-down
  last_played: [],	// list of last played circuit ids

  // save to localStorage
  save() {
    localStorage.setItem('workout_settings', JSON.stringify({
      workout_length: this.workout_length,
      pause_length: this.pause_length,
      warmups: this.warmups,
      last_played: this.last_played,
    }));
  },

  // add a circuit id to last-played
  played(id) {
    this.last_played = this.last_played.filter(x => x !== id);
    this.last_played.unshift(id);
    this.save();
  },
});

// Load settings from localStorage on mount
onMounted(() => {
  const saved_settings = localStorage.getItem('workout_settings');
  if (saved_settings) {
    try {
      const parsed_settings = JSON.parse(saved_settings);
      store.workout_length = parsed_settings.workout_length || 30;
      store.pause_length = parsed_settings.pause_length || 5;
      store.warmups = parsed_settings.warmups !== undefined ? parsed_settings.warmups : true;
      store.last_played = parsed_settings.last_played || [];
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
});

provide('store', store);
</script>

<template>
  <div class="app-container">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --main: #4CAF50;
}

body {
  font-family: 'Roboto', 'Segoe UI', system-ui, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

.app-container {
  max-width: 480px;
  min-height: 100vh;
  margin: 0 auto;
  background-color: white;
  /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); */
  position: relative;
  overflow: hidden;
}

button {
  background-color: var(--main);
  color: white;
  border: none;
  padding: 8px 4px;
  border-radius: 2px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.toggle-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin: 10px 0;
}
</style>
