/* FerroDaStiro - Exercise Catalog & Equivalence Helpers */

const BENCHMARK_BALANCE = {
  Chest: { ratio: 1.00, idealRatio: 1.00, benchmark: 'Barbell Bench Press' },
  Shoulders: { ratio: 0.65, idealRatio: 0.65, benchmark: 'Standing Overhead Press' },
  Biceps: { ratio: 0.40, idealRatio: 0.40, benchmark: 'Barbell Curl' },
  Legs: { ratio: 1.45, idealRatio: 1.45, benchmark: 'Back Squat' },
  Back: { ratio: 1.67, idealRatio: 1.67, benchmark: 'Conventional Deadlift' },
  Triceps: { ratio: 0.90, idealRatio: 0.90, benchmark: 'Close-Grip Bench Press' }
};

const RADAR_GROUPS = ['Chest', 'Shoulders', 'Biceps', 'Legs', 'Back', 'Triceps'];

const GROUP_HINTS = {
  Chest: 'Add bench press, incline press, or dips to balance pushing strength.',
  Back: 'Add more rows or pull-ups to balance horizontal push/pull.',
  Shoulders: 'Add overhead press or lateral raises to build overhead strength and stability.',
  Legs: 'Add back squats, front squats, or leg presses for lower-body foundation.',
  Biceps: 'Add barbell or dumbbell curls to reinforce pulling and elbow flexion.',
  Triceps: 'Add close-grip bench or dips to reinforce lockout and pressing strength.'
};

/* Exercises are connected to the main movement of their muscle group that has coefficient 1.0.
   The comparison for the radar chart is instead done with other coefficients. Look at "BENCHMARK_BALANCE". */
const EXER_EQUIV_MAP = {
  Chest: {
    'Bench press': 1.0, 'Incline barbell press': 0.85, 'Dumbbell bench press': 0.82,
    'Incline dumbbell press': 0.75, 'Machine chest press': 1.05, 'Push-up': 0.65, 'Dip': 1.05
  },
  Back: {
    'Deadlift': 1.0, 'Rack pull': 1.20, 'T-bar row': 0.72, 'Barbell row': 0.60,
    'Pendlay row': 0.52, 'Cable row': 0.55, 'Lat pulldown': 0.55, 'Pull-up': 0.60,
    'Chin-up': 0.60
  },
  Shoulders: {
    'Overhead press': 1.0, 'Seated dumbbell press': 0.80, 'Machine shoulder press': 1.05,
    'Arnold press': 0.72, 'Upright row': 0.80
  },
  Legs: {
    'Back squat': 1.0, 'Front squat': 0.80, 'Hack squat': 1.15, 'Leg press': 1.85,
    'Romanian deadlift': 0.95, 'Stiff-leg deadlift': 0.90, 'Bulgarian split squat': 0.90,
    'Walking lunge': 0.90, 'Hip thrust': 1.25, 'Glute bridge': 1.10, 'Good morning': 0.60
  },
  Biceps: {
    'Barbell curl': 1.0, 'EZ-bar curl': 0.98, 'Dumbbell curl': 0.90,
    'Hammer curl': 0.90, 'Incline dumbbell curl': 0.85, 'Preacher curl': 0.90, 'Cable curl': 0.90
  },
  Triceps: {
    'Close-grip bench press': 1.0, 'Triceps pushdown': 0.75,
    'Overhead triceps extension': 0.65, 'Skull crusher': 0.70, 'Bench dip': 0.80
  }
};

const EXER_EQUIV_FLAT = {};
Object.values(EXER_EQUIV_MAP).forEach(map => Object.assign(EXER_EQUIV_FLAT, map));

function getExCoeff(name) {
  const meta = (typeof window !== 'undefined' && window.exMeta) ? window.exMeta(name) : EXERCISES.find(e => e.n === name);
  if (meta) {
    if (meta.coeff !== undefined && meta.coeff !== null && +meta.coeff > 0) {
      return +meta.coeff;
    }
    return undefined;
  }
  if (typeof name === 'string' && /leg press|45.*leg press/i.test(name)) {
    return 1.85;
  }
  if (EXER_EQUIV_FLAT && name in EXER_EQUIV_FLAT && EXER_EQUIV_FLAT[name] > 0) {
    return EXER_EQUIV_FLAT[name];
  }
  return undefined;
}

function getExMeasurement(ex) {
  let meta = null;
  if (typeof ex === 'string') {
    meta = (typeof window !== 'undefined' && window.exMeta) ? window.exMeta(ex) : EXERCISES.find(e => e.n === ex);
  } else {
    meta = ex;
  }
  if (!meta) return 'reps';
  if (meta.m === 'min' || meta.t === 'min' || meta.unit === 'min' || meta.min) return 'min';
  if (meta.m === 'sec' || meta.t === 1 || meta.t === 'sec' || meta.unit === 'sec' || meta.sec) return 'sec';
  return 'reps';
}

const EXERCISE_EQUIV = new Proxy(EXER_EQUIV_FLAT, {
  get: (target, prop) => {
    if (typeof prop === 'string') {
      const c = getExCoeff(prop);
      if (c !== undefined) return c;
    }
    return prop in target ? target[prop] : 1.0;
  }
});

const GROUPS = ['Chest','Back','Shoulders','Legs','Biceps','Triceps','Core','Conditioning','Cardio'];

const EXERCISES = [
  {n:'Bench press',g:'Chest',s:4,r:6,coeff:1.0},{n:'Incline barbell press',g:'Chest',s:4,r:8,coeff:0.85},
  {n:'Incline dumbbell press',g:'Chest',s:3,r:10,coeff:0.75},{n:'Dumbbell bench press',g:'Chest',s:3,r:10,coeff:0.82},
  {n:'Dumbbell fly',g:'Chest',s:3,r:12},{n:'Cable crossover',g:'Chest',s:3,r:15},
  {n:'Machine chest press',g:'Chest',s:3,r:10,coeff:1.05},{n:'Push-up',g:'Chest',s:3,r:15,coeff:0.65},
  {n:'Dip',g:'Chest',s:3,r:8,coeff:1.05},
  {n:'High-to-low cable fly',g:'Chest',s:3,r:15},
  {n:'Low-to-high cable fly',g:'Chest',s:3,r:15},
  {n:'Pec deck fly',g:'Chest',s:3,r:12},
  {n:'Incline machine chest press',g:'Chest',s:3,r:10},

  {n:'Deadlift',g:'Back',s:3,r:5,coeff:1.0},{n:'Rack pull',g:'Back',s:3,r:6,coeff:1.20},
  {n:'Barbell row',g:'Back',s:4,r:8,coeff:0.60},{n:'Pendlay row',g:'Back',s:4,r:6,coeff:0.52},
  {n:'Dumbbell row',g:'Back',s:3,r:10},{n:'T-bar row',g:'Back',s:3,r:10,coeff:0.72},
  {n:'Cable row',g:'Back',s:3,r:12,coeff:0.55},{n:'Lat pulldown',g:'Back',s:3,r:10,coeff:0.55},
  {n:'Pull-up',g:'Back',s:4,r:6,coeff:0.60},{n:'Chin-up',g:'Back',s:4,r:8,coeff:0.60},
  {n:'Straight-arm pulldown',g:'Back',s:3,r:15},{n:'Shrug',g:'Back',s:3,r:12},
  {n:'Hyperextension (back)',g:'Back',s:3,r:15},
  {n:'Single-arm dumbbell row',g:'Back',s:3,r:10},
  {n:'Single-arm cable lat pulldown',g:'Back',s:3,r:12},
  {n:'Single-arm cable seated row',g:'Back',s:3,r:12},

  {n:'Overhead press',g:'Shoulders',s:4,r:6,coeff:1.0},{n:'Seated dumbbell press',g:'Shoulders',s:3,r:10,coeff:0.80},
  {n:'Arnold press',g:'Shoulders',s:3,r:10,coeff:0.72},{n:'Lateral raise',g:'Shoulders',s:3,r:15},
  {n:'Cable lateral raise',g:'Shoulders',s:3,r:15},{n:'Rear delt fly',g:'Shoulders',s:3,r:15},
  {n:'Face pull',g:'Shoulders',s:3,r:15},{n:'Upright row',g:'Shoulders',s:3,r:12,coeff:0.80},
  {n:'Single-arm cable lateral raise',g:'Shoulders',s:3,r:15},
  {n:'Single-arm dumbbell lateral raise',g:'Shoulders',s:3,r:15},
  {n:'Single-arm dumbbell shoulder press',g:'Shoulders',s:3,r:10},
  {n:'Cable front raise',g:'Shoulders',s:3,r:15},
  {n:'Cable face pull',g:'Shoulders',s:3,r:15},

  {n:'Back squat',g:'Legs',s:4,r:6,coeff:1.0},{n:'Front squat',g:'Legs',s:3,r:6,coeff:0.80},
  {n:'Hack squat',g:'Legs',s:3,r:10,coeff:1.15},{n:'Leg press',g:'Legs',s:3,r:12,coeff:1.85},
  {n:'Romanian deadlift',g:'Legs',s:3,r:8,coeff:0.95},{n:'Stiff-leg deadlift',g:'Legs',s:3,r:8,coeff:0.90},
  {n:'Bulgarian split squat',g:'Legs',s:3,r:10,coeff:0.90},{n:'Walking lunge',g:'Legs',s:3,r:12,coeff:0.90},
  {n:'Step-up',g:'Legs',s:3,r:12},{n:'Leg extension',g:'Legs',s:3,r:15},
  {n:'Leg curl',g:'Legs',s:3,r:12},{n:'Hip thrust',g:'Legs',s:3,r:10,coeff:1.25},
  {n:'Glute bridge',g:'Legs',s:3,r:12,coeff:1.10},{n:'Good morning',g:'Legs',s:3,r:10,coeff:0.60},
  {n:'Standing calf raise',g:'Legs',s:4,r:15},{n:'Seated calf raise',g:'Legs',s:4,r:15},
  {n:'Hyperextensions (thighs)',g:'Legs',s:3,r:15},
  {n:'Single-leg extension',g:'Legs',s:3,r:12},
  {n:'Single-leg curl',g:'Legs',s:3,r:12},
  {n:'Single-leg 45° press',g:'Legs',s:3,r:12},
  {n:'Seated leg curl',g:'Legs',s:3,r:12},
  {n:'Lying leg curl',g:'Legs',s:3,r:12},
  {n:'Standing calf raise (machine)',g:'Legs',s:4,r:15},

  {n:'Barbell curl',g:'Biceps',s:3,r:10,coeff:1.0},{n:'EZ-bar curl',g:'Biceps',s:3,r:10,coeff:0.98},
  {n:'Dumbbell curl',g:'Biceps',s:3,r:12,coeff:0.90},{n:'Hammer curl',g:'Biceps',s:3,r:12,coeff:0.90},
  {n:'Incline dumbbell curl',g:'Biceps',s:3,r:12,coeff:0.85},{n:'Preacher curl',g:'Biceps',s:3,r:12,coeff:0.90},
  {n:'Cable curl',g:'Biceps',s:3,r:15,coeff:0.90},
  {n:'Single-arm cable curl',g:'Biceps',s:3,r:12},
  {n:'Single-arm dumbbell curl',g:'Biceps',s:3,r:12},
  {n:'EZ-bar preacher curl',g:'Biceps',s:3,r:10},

  {n:'Triceps pushdown',g:'Triceps',s:3,r:12,coeff:0.75},{n:'Overhead triceps extension',g:'Triceps',s:3,r:12,coeff:0.65},
  {n:'Skull crusher',g:'Triceps',s:3,r:10,coeff:0.70},{n:'Close-grip bench press',g:'Triceps',s:3,r:8,coeff:1.0},
  {n:'Bench dip',g:'Triceps',s:3,r:12,coeff:0.80},
  {n:'Single-arm triceps pushdown',g:'Triceps',s:3,r:12},
  {n:'Single-arm overhead cable extension',g:'Triceps',s:3,r:12},
  {n:'Rope triceps pushdown',g:'Triceps',s:3,r:12},
  {n:'Cable triceps kickback',g:'Triceps',s:3,r:15},

  {n:'Plank',g:'Core',s:3,r:45,m:'sec',t:1},{n:'Side plank',g:'Core',s:3,r:30,m:'sec',t:1},
  {n:'Hanging leg raise',g:'Core',s:3,r:12},{n:'Cable crunch',g:'Core',s:3,r:15},
  {n:'Ab wheel rollout',g:'Core',s:3,r:10},{n:'Russian twist',g:'Core',s:3,r:20},
  {n:'Dead bug',g:'Core',s:3,r:12},{n:'Back extension',g:'Core',s:3,r:15},
  {n:'Cable woodchopper',g:'Core',s:3,r:15},

  {n:'Assault bike',g:'Conditioning',s:5,r:60,m:'sec',t:1},
  {n:'Jump rope',g:'Conditioning',s:4,r:60,m:'sec',t:1},{n:'Kettlebell swing',g:'Conditioning',s:4,r:20},
  {n:"Farmer's walk",g:'Conditioning',s:3,r:40,m:'sec',t:1},{n:'Sled push',g:'Conditioning',s:5,r:30,m:'sec',t:1},

  {n:'Treadmill (run)',g:'Cardio',s:1,r:20,m:'min'},
  {n:'Stationary bike',g:'Cardio',s:1,r:20,m:'min'},
  {n:'Rowing machine',g:'Cardio',s:1,r:15,m:'min'},
  {n:'Elliptical',g:'Cardio',s:1,r:20,m:'min'},
  {n:'Stairmaster',g:'Cardio',s:1,r:15,m:'min'},
  {n:'Incline walk',g:'Cardio',s:1,r:30,m:'min'}
];

function exSlug(name) {
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Global window/globalThis assignments for browser context
if (typeof globalThis !== 'undefined') {
  globalThis.BENCHMARK_BALANCE = BENCHMARK_BALANCE;
  globalThis.RADAR_GROUPS = RADAR_GROUPS;
  globalThis.GROUP_HINTS = GROUP_HINTS;
  globalThis.EXER_EQUIV_MAP = EXER_EQUIV_MAP;
  globalThis.EXER_EQUIV_FLAT = EXER_EQUIV_FLAT;
  globalThis.EXERCISE_EQUIV = EXERCISE_EQUIV;
  globalThis.GROUPS = GROUPS;
  globalThis.EXERCISES = EXERCISES;
  globalThis.exSlug = exSlug;
  globalThis.getExCoeff = getExCoeff;
  globalThis.getExMeasurement = getExMeasurement;
}

// CommonJS export support for Node environment / test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BENCHMARK_BALANCE,
    RADAR_GROUPS,
    GROUP_HINTS,
    EXER_EQUIV_MAP,
    EXER_EQUIV_FLAT,
    EXERCISE_EQUIV,
    GROUPS,
    EXERCISES,
    exSlug,
    getExCoeff,
    getExMeasurement
  };
}
