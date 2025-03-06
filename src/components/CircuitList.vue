<template>
  <div class="circuit-list">
    <div style="float:right">
      <button @click="go_to_settings" class="settings-button">⚙️</button>
    </div>

    <h1>
      <img src="/assets/frog.png" style="width:48px; height:48px; vertical-align:-18%">
      7FROG
    </h1>
 
    <div class="toggle-switch">
      <span>Warm-up &amp; Cool-down</span>
      <label class="switch">
        <input type="checkbox" v-model="store.warmups">
        <span class="slider round"></span>
      </label>
    </div>
    
    <div class="circuits">
      <template
        v-for="circuit in show_circuits" 
        :key="circuit.id" 
      >
	<div 
	  class="circuit-card"
	  @click="start_workout(circuit.id)"
	>
	  <h2>{{ circuit.name }}</h2>
	  <p class="difficulty">{{ circuit.difficulty }}</p>
	  <p class="exercise-count">{{ circuit.exercises.length }} exercises, approx. {{ calculate_duration(circuit) }} minutes</p>
	</div>
      </template>
    </div>

    <div v-if="!show_all" class="show-all">
      <span @click="show_all = true" class="ql">Show all</span>
    </div>


  </div>
</template>

<script setup>
import { inject, watch, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import circuits from '../data/circuits.json';
import exercises from '../data/exercises.json';

const store = inject('store');
const router = useRouter();

const show_all = ref(false);

// list of circuits to display
const show_circuits = computed(() => {
  let ids;
  if (show_all.value) {
    ids = store.last_played.concat([ ...circuits.keys() ]);
    ids = Array.from(new Set(ids));	// uniquefy

  } else {
    ids = [0];
    if (store.last_played.length && store.last_played[0] !== 0) ids.unshift(store.last_played[0]);
  }

  return ids.map(x => circuits[x]);
});

const calculate_duration = (circuit) => {
  let total_seconds = 0;
  
  // Add warm-up if enabled
  if (store.warmups && exercises[0]) {
    total_seconds += exercises[0].fixed_len || store.workout_length;
  }
  
  // Calculate main exercises
  for (const exercise_id of circuit.exercises) {
    const exercise = exercises[exercise_id];
    if (!exercise) continue;
    
    const duration = exercise.fixed_len || (store.workout_length * (exercise.multiply || 1));
    total_seconds += duration;
    
    // Add pause between exercises
    total_seconds += store.pause_length;
  }
  
  // Add cool-down if enabled
  if (store.warmups && exercises[1]) {
    total_seconds += exercises[1].fixed_len || store.workout_length;
  }
  
  // Convert to minutes and round
  return Math.round(total_seconds / 60);
};

const start_workout = (circuit_id) => {
  store.played(circuit_id);
  router.replace(`/workout/${circuit_id}`);
};

const go_to_settings = () => {
  router.replace('/settings');
};

// save settings on warmups change
watch(
  () => store.warmups,
  () => store.save()
);
</script>

<style scoped>
.circuit-list {
  padding: 20px;
}

h1 {
  text-align: left;
  margin-bottom: 20px;
  color: #093;
  font-size:36px;
}

.circuits {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.circuit-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.circuit-card:hover {
  border-color: #aaa;
  background-color: #f8f8f8;
}

.difficulty {
  /* display: inline-block; */
  float: right;
  background-color: #4CAF50;
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin: 6px 0 0 4px;
}

.exercise-count {
  margin-top: 8px;
  color: #666;
  font-size: 0.9rem;
}

/* Toggle Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.settings-button {
  background: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size:20px;
  margin:0;
}

.settings-button:hover {
  background-color: #f8f8f8;
}

.toggle-switch {
  margin:40px 0 40px 0;
}

h2 {
  font-size:1.2em;
}

.show-all {
  text-align:center;
  margin-top:20px;
}

.show-all span {
  line-height:48px;
}

.ql { color:#36f; text-decoration:none; cursor:pointer }
</style>

