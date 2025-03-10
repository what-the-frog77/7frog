<script>
export default {
  // disable automatic application of attributes like id, avoid warnings
  inheritAttrs: false,
};
</script>

<script setup>
import { ref, inject, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import circuits from '../data/circuits.json';
import exercises from '../data/exercises.json';

const store = inject('store');
const router = useRouter();
const route = useRoute();

const circuit_id = parseInt(route.params.id);
const circuit = circuits[circuit_id];

// State variables
const current_exercise_index = ref(-1);  // -1 means not started yet
const is_paused = ref(false);
const is_preparing = ref(true);
const countdown = ref(0);
const is_completed = ref(false);
const show_switch = ref(false);
const video_player = ref(null);
const show_exit_confirm = ref(false);

// Audio elements
const audio_player = new Audio();

// Timer reference
let timer_id = null;

// Computed properties
const exercise_queue = computed(() => {
  if (!circuit) return [];
  
  let queue = [];
  
  // Add warm-up if enabled
  if (store.warmups && exercises[0]) {
    queue.push(exercises[0]);
  }
  
  // Add main exercises
  for (const ex_id of circuit.exercises) {
    const exercise = exercises[ex_id];
    if (exercise) queue.push(exercise);
  }
  
  // Add cool-down if enabled
  if (store.warmups && exercises[1]) {
    queue.push(exercises[1]);
  }
  
  return queue;
});

const total_exercises = computed(() => exercise_queue.value.length);

const current_exercise = computed(() => {
  if (current_exercise_index.value < 0 || 
      current_exercise_index.value >= exercise_queue.value.length) {
    return null;
  }
  return exercise_queue.value[current_exercise_index.value];
});

const next_exercise = computed(() => {
  const next_index = current_exercise_index.value + 1;
  if (next_index >= exercise_queue.value.length) {
    return null;
  }
  return exercise_queue.value[next_index];
});

const exercise_duration = computed(() => {
  if (!current_exercise.value) return 0;
  
  return current_exercise.value.fixed_len || 
         (store.workout_length * (current_exercise.value.multiply || 1));
});

// Methods
const start_workout = () => {
  current_exercise_index.value = 0;
  prepare_for_exercise();
};

const play_audio = (src) => {
  audio_player.src = src;
  audio_player.currentTime = 0;
  audio_player.play().catch(err => console.error("Audio error:", err));
};

const prepare_for_exercise = () => {
  is_preparing.value = true;
  countdown.value = store.pause_length;
  if (audio_player.src) audio_player.pause();
  
  // Play "next up" audio if not warm-up or cool-down
  if (current_exercise.value && 
      current_exercise.value.id !== 0 && 
      current_exercise.value.id !== 1) {
    play_audio(`./assets/nextup/${current_exercise.value.id}.mp3`);
  }
  
  start_timer();
};

const start_exercise = () => {
  is_preparing.value = false;
  countdown.value = exercise_duration.value;
  show_switch.value = false;
  if (audio_player.src) audio_player.pause();

  // Play exercise name audio if not using own audio
  if (current_exercise.value && !current_exercise.value.own_audio) {
    play_audio(`./assets/prompt/${current_exercise.value.id}.mp3`);
  }
  
  // Make sure video is playing if not paused
  if (video_player.value && !is_paused.value) {
    video_player.value.play().catch(err => console.error("Video error:", err));
  }
  
  start_timer();
};

const complete_exercise = () => {
  current_exercise_index.value++;
  
  if (current_exercise_index.value >= exercise_queue.value.length) {
    complete_workout();
  } else {
    prepare_for_exercise();
  }
};

const complete_workout = () => {
  is_completed.value = true;
  clear_timer();
};

const start_timer = () => {
  clear_timer();
  
  timer_id = setInterval(() => {
    if (countdown.value <= 0) {
      clear_timer();
      
      if (is_preparing.value) {
        start_exercise();
      } else {
        complete_exercise();
      }
    } else {
      countdown.value--;
      
      // Play beep 3 seconds before end
      if (countdown.value === 3) {
	play_audio('./assets/beep.mp3');
      }
      
      // Check if we need to announce "switch sides"
      if (!is_preparing.value && 
          current_exercise.value?.switch && 
          countdown.value === Math.floor(exercise_duration.value / 2)) {
        show_switch.value = true;
	play_audio('./assets/switch.mp3');
        
        // Hide the switch notification after 3 seconds
        setTimeout(() => {
          show_switch.value = false;
        }, 3000);
      }
    }
  }, 1000);
};

const clear_timer = () => {
  if (timer_id !== null) {
    clearInterval(timer_id);
    timer_id = null;
  }
};

const set_pause = (val) => {
  val = !!val;
  if (is_paused.value === val) return;
  is_paused.value = val;

  if (val) {
    clear_timer();
    if (video_player.value) video_player.value.pause();
    if (audio_player.src && !audio_player.ended) audio_player.pause();
  } else {
    start_timer();
    if (video_player.value) video_player.value.play();
    if (audio_player.src && !audio_player.ended) audio_player.play();
  }
};

const toggle_pause = () => {
  set_pause(!is_paused.value);
};

const skip_exercise = () => {
  if (is_preparing.value) {
    start_exercise();
  } else {
    complete_exercise();
  }
};

const confirm_exit = () => {
  show_exit_confirm.value = true;
  set_pause(true);
};

const go_back = () => {
  clear_timer();
  router.back();
};

const format_time = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Lifecycle hooks
onMounted(() => {
  // Start the workout when component is mounted
  start_workout();
});

onBeforeUnmount(() => {
  // Clean up timers and audio
  clear_timer();
  if (audio_player.src) audio_player.pause();
});
</script>

<template>
  <div class="workout-player">
    <template v-if="!is_completed">
      <!-- "Get Ready" countdown screen -->
      <div v-if="is_preparing" class="prepare-screen" @click="toggle_pause">
        <h2>Get Ready!</h2>
        <div class="big-counter">{{ countdown }}</div>
        <h3>Next up: {{ current_exercise?.name }}</h3>
      </div>
      
      <!-- Active exercise screen -->
      <div v-else class="exercise-screen">
        <div class="exercise-info">
          <h2>{{ current_exercise?.name }}</h2>
          <div class="timer">{{ format_time(countdown) }}</div>
          
          <!-- Switch sides notification -->
          <div v-if="show_switch" class="switch-notification">
            Switch Sides!
          </div>
        </div>
        
        <div class="video-container">
          <video
            ref="video_player"
            :src="`./assets/videos/${current_exercise?.id}.mp4`"
            :loop="!current_exercise?.own_audio"
            playsinline
            :autoplay="!is_paused"
	    @click="toggle_pause"
	    poster="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
          ></video>
          
        </div>
      </div>

      <!-- Pause overlay -->
      <div v-if="is_paused" class="pause-overlay" @click="toggle_pause">
	<div class="pause-icon">II</div>
      </div>

      <div class="controls">
	<button @click="confirm_exit" class="exit-button">Exit</button>
	<button @click="toggle_pause" class="pause-button">Pause</button>
	<button @click="skip_exercise" class="skip-button">Skip</button>
      </div>
    </template>
    
    <!-- Workout completed screen -->
    <div v-else class="completion-screen">
      <h2>Workout Complete!</h2>
      <p>Great job!</p>
      <button @click="go_back" class="primary-button">Back to Workouts</button>
    </div>
  </div>

  <div v-if="show_exit_confirm" class="overlay">
    <div class="confirm-dialog">
      <h3>Exit Workout?</h3>
      <p>Your progress will be lost.</p>
      <div class="dialog-buttons">
	<button @click="show_exit_confirm = false; set_pause(false)" class="cancel-button">Cancel</button>
	<button @click="go_back" class="confirm-button">Exit</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workout-player {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* Prepare screen */
.prepare-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* align-items: center; */
  text-align: center;
  background: #fff;
}

.big-counter {
  font-size: 6rem;
  font-weight: bold;
  margin: 20px 0;
  color: var(--main);
}

/* Exercise screen */
.exercise-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.exercise-info {
  padding: 15px;
  text-align: center;
  position: relative;
  background:#fff;
}

.timer {
  font-size: 2.8rem;
  font-weight: bold;
  margin-top: 4px;
  color: var(--main);
}

h2 {
  font-size:1.8rem;
}

.switch-notification {
  position: absolute;
  top: 200px;
  left: 50%;
  background-color: var(--main);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: bold;
  animation: pulse 1s infinite;
  z-index: 5;
}

.video-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #fff;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.pause-icon {
  color: white;
  font-size: 3rem;
  background-color: rgba(0, 0, 0, 0.5);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.controls {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #ddd;
  /* border-bottom: 1px solid #ddd;
  margin-bottom:48px; */
}

.controls button {
  min-width: 80px;
}

.exit-button {
  border: 1px solid #999;
  background: #fff;
  color: #999;
}

.pause-button {
  background-color: var(--main);
}

.skip-button {
  border: 1px solid var(--main);
  background: #fff;
  color: var(--main);
}

/* Completion screen */
.completion-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.primary-button {
  margin-top: 20px;
  padding: 12px 24px;
  font-size: 1.1rem;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.confirm-dialog {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 300px;
  text-align: center;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.dialog-buttons button {
  min-width: 90px;
}

.cancel-button {
  border: 1px solid #999;
  color: #999;
  background: #fff;
}

.confirm-button {
  background-color: var(--main);
}
</style>

