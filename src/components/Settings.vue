<template>
  <div class="settings-screen">
    <div class="header">
      <h1>Settings</h1>
    </div>
    
    <div class="settings-form">
      <div class="form-group">
        <label for="workout_length">Exercise Duration (seconds)</label>
        <input 
          type="number" 
          id="workout_length" 
          v-model.number="workout_length"
          min="5"
          @input="validate_input('workout_length')"
        >
        <div v-if="errors.workout_length" class="error-message">
          {{ errors.workout_length }}
        </div>
      </div>
      
      <div class="form-group">
        <label for="pause_length">Get Ready Duration (seconds)</label>
        <input 
          type="number" 
          id="pause_length" 
          v-model.number="pause_length"
          min="5"
          @input="validate_input('pause_length')"
        >
        <div v-if="errors.pause_length" class="error-message">
          {{ errors.pause_length }}
        </div>
      </div>

      <div class="controls">
	<button @click="go_back" class="cancel-button">Cancel</button>
	<button @click="save_settings" class="save-button" :disabled="!is_valid">Save Settings</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = inject('store');

// Local state for form inputs
const workout_length = ref(store.workout_length);
const pause_length = ref(store.pause_length);
const errors = ref({
  workout_length: '',
  pause_length: ''
});

// Computed property to check if form is valid
const is_valid = computed(() => {
  return !errors.value.workout_length && !errors.value.pause_length;
});

// Validate input fields
const validate_input = (field) => {
  const value = field === 'workout_length' ? workout_length.value : pause_length.value;
  
  if (!value || value < 5) {
    errors.value[field] = 'Value must be at least 5 seconds';
  } else {
    errors.value[field] = '';
  }
};

// Save settings and go back
const save_settings = () => {
  if (!is_valid.value) return;
  
  // Update store values
  store.workout_length = workout_length.value;
  store.pause_length = pause_length.value;

  // Save settings
  store.save();
  
  // Show success message and go back
  // alert('Settings saved successfully!');
  go_back();
};

// Navigation
const go_back = () => {
  router.replace('/7frog');
};
</script>

<style scoped>
.settings-screen {
  padding: 20px;
}

.header {
  margin-bottom: 40px;
  text-align: center;
}

h1 {
  margin-left: 10px;
  font-size: 1.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: bold;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
}

.error-message {
  color: #f44336;
  font-size: 0.8rem;
}

.cancel-button {
  font-size: 1rem;
  margin-top: 10px;
  border: 1px solid #4CAF50;
  background: #fff;
  color: #4CAF50;
}

.save-button {
  padding: 12px;
  font-size: 1rem;
  margin-top: 10px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  background-color: #fff;
}

.controls button {
  min-width: 120px;
}

</style>
