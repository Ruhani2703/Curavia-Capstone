const mongoose = require('mongoose');
const DietPlanTemplate = require('../models/DietPlanTemplate');
const ExercisePlanTemplate = require('../models/ExercisePlanTemplate');
const User = require('../models/User');
require('dotenv').config();

const dietPlanTemplates = [
  {
    name: "Post-Bariatric Surgery Recovery Diet",
    description: "Comprehensive nutrition plan for bariatric surgery patients focusing on protein-rich, small portions to support healing and prevent complications.",
    surgeryType: "Bariatric",
    phase: "Phase 1",
    duration: "6 weeks",
    dailyCalories: 800,
    dailyProtein: 60,
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        items: ["Protein shake with banana", "1 slice whole grain toast"],
        calories: 200,
        protein: 20,
        carbs: 25,
        fats: 5,
        instructions: "Eat slowly and chew thoroughly. Stop when feeling full."
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        items: ["Greek yogurt (3 oz)", "Berries (1/4 cup)"],
        calories: 100,
        protein: 12,
        carbs: 8,
        fats: 2,
        instructions: "Choose low-fat, sugar-free options."
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        items: ["Grilled chicken (2 oz)", "Steamed vegetables", "Sweet potato (1/4 cup)"],
        calories: 180,
        protein: 20,
        carbs: 15,
        fats: 3,
        instructions: "Protein first, then vegetables, then carbs if still hungry."
      },
      {
        name: "Afternoon Snack",
        time: "3:30 PM",
        items: ["Cottage cheese (2 oz)", "Cucumber slices"],
        calories: 80,
        protein: 10,
        carbs: 4,
        fats: 2,
        instructions: "Light portion to maintain energy levels."
      },
      {
        name: "Dinner",
        time: "6:00 PM",
        items: ["Baked fish (2 oz)", "Quinoa (1/4 cup)", "Green salad"],
        calories: 200,
        protein: 18,
        carbs: 20,
        fats: 4,
        instructions: "Eat dinner at least 3 hours before bedtime."
      }
    ],
    restrictions: ["No carbonated beverages", "No high-sugar foods", "No raw vegetables initially"],
    supplements: [
      { name: "Multivitamin", dosage: "1 tablet daily", timing: "With breakfast", reason: "Prevent nutritional deficiencies" },
      { name: "Calcium citrate", dosage: "500mg twice daily", timing: "Between meals", reason: "Bone health support" }
    ],
    specialInstructions: [
      "Eat 5-6 small meals per day",
      "Chew food thoroughly (20-30 times per bite)",
      "Separate liquids from meals by 30 minutes",
      "Stop eating when feeling satisfied"
    ]
  },
  {
    name: "Cardiac Recovery Heart-Healthy Diet",
    description: "Low-sodium, Mediterranean-style diet designed for cardiac surgery patients to promote heart health and reduce inflammation.",
    surgeryType: "Cardiac",
    phase: "Phase 2",
    duration: "8 weeks",
    dailyCalories: 1800,
    dailyProtein: 100,
    meals: [
      {
        name: "Breakfast",
        time: "7:30 AM",
        items: ["Oatmeal with walnuts", "Fresh berries", "Low-fat milk"],
        calories: 350,
        protein: 15,
        carbs: 45,
        fats: 12,
        instructions: "Use steel-cut oats for better fiber content."
      },
      {
        name: "Mid-Morning Snack",
        time: "10:00 AM",
        items: ["Apple slices", "Almond butter (1 tbsp)"],
        calories: 150,
        protein: 4,
        carbs: 15,
        fats: 8,
        instructions: "Choose unsalted nut butter."
      },
      {
        name: "Lunch",
        time: "12:30 PM",
        items: ["Mediterranean salad with olive oil", "Grilled salmon (4 oz)", "Whole grain roll"],
        calories: 500,
        protein: 35,
        carbs: 30,
        fats: 20,
        instructions: "Use herbs instead of salt for seasoning."
      },
      {
        name: "Afternoon Snack",
        time: "3:00 PM",
        items: ["Hummus (2 tbsp)", "Carrot sticks", "Bell pepper strips"],
        calories: 120,
        protein: 4,
        carbs: 12,
        fats: 6,
        instructions: "Choose low-sodium hummus varieties."
      },
      {
        name: "Dinner",
        time: "6:30 PM",
        items: ["Herb-crusted chicken breast", "Roasted vegetables", "Brown rice"],
        calories: 450,
        protein: 40,
        carbs: 35,
        fats: 12,
        instructions: "Season with herbs, garlic, and lemon instead of salt."
      }
    ],
    restrictions: ["Limit sodium to 2000mg daily", "No trans fats", "Limited saturated fats"],
    supplements: [
      { name: "Omega-3", dosage: "1000mg daily", timing: "With dinner", reason: "Heart health and inflammation reduction" },
      { name: "CoQ10", dosage: "100mg daily", timing: "With breakfast", reason: "Support heart muscle function" }
    ],
    specialInstructions: [
      "Read all food labels for sodium content",
      "Use herbs and spices for flavoring",
      "Include fatty fish 2-3 times per week",
      "Limit alcohol consumption"
    ]
  },
  {
    name: "Orthopedic Recovery Anti-Inflammatory Diet",
    description: "Nutrient-dense diet focusing on anti-inflammatory foods to support bone healing and reduce joint inflammation after orthopedic surgery.",
    surgeryType: "Orthopedic",
    phase: "Phase 2",
    duration: "12 weeks",
    dailyCalories: 2000,
    dailyProtein: 120,
    meals: [
      {
        name: "Breakfast",
        time: "7:00 AM",
        items: ["Spinach and mushroom omelet", "Avocado toast", "Green tea"],
        calories: 400,
        protein: 25,
        carbs: 25,
        fats: 18,
        instructions: "Include leafy greens daily for bone health nutrients."
      },
      {
        name: "Mid-Morning Snack",
        time: "9:30 AM",
        items: ["Greek yogurt with turmeric", "Mixed berries"],
        calories: 180,
        protein: 15,
        carbs: 20,
        fats: 3,
        instructions: "Turmeric has natural anti-inflammatory properties."
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        items: ["Lentil soup", "Kale and quinoa salad", "Grilled chicken"],
        calories: 550,
        protein: 40,
        carbs: 45,
        fats: 15,
        instructions: "Legumes provide plant-based protein for healing."
      },
      {
        name: "Afternoon Snack",
        time: "4:00 PM",
        items: ["Trail mix with nuts and seeds", "Tart cherry juice"],
        calories: 200,
        protein: 8,
        carbs: 15,
        fats: 12,
        instructions: "Tart cherries may help reduce inflammation."
      },
      {
        name: "Dinner",
        time: "7:00 PM",
        items: ["Baked cod with herbs", "Sweet potato", "Steamed broccoli"],
        calories: 450,
        protein: 35,
        carbs: 40,
        fats: 8,
        instructions: "Fish provides omega-3s for joint health."
      }
    ],
    restrictions: ["Limit processed foods", "Reduce refined sugars", "Minimize inflammatory oils"],
    supplements: [
      { name: "Vitamin D3", dosage: "2000 IU daily", timing: "With breakfast", reason: "Bone healing and calcium absorption" },
      { name: "Calcium", dosage: "1000mg daily", timing: "Divided with meals", reason: "Bone health and healing" },
      { name: "Vitamin C", dosage: "500mg daily", timing: "With breakfast", reason: "Collagen synthesis for healing" }
    ],
    specialInstructions: [
      "Include colorful fruits and vegetables daily",
      "Choose anti-inflammatory spices like turmeric and ginger",
      "Stay hydrated for joint lubrication",
      "Maintain adequate protein for tissue repair"
    ]
  },
  {
    name: "Neurological Recovery Brain-Boosting Diet",
    description: "Specialized nutrition plan for neurological surgery patients emphasizing brain-healthy foods and nutrients that support cognitive function and neural healing.",
    surgeryType: "Neurological",
    phase: "Phase 3",
    duration: "16 weeks",
    dailyCalories: 1900,
    dailyProtein: 110,
    meals: [
      {
        name: "Breakfast",
        time: "8:00 AM",
        items: ["Blueberry walnut smoothie", "Whole grain toast with avocado"],
        calories: 380,
        protein: 18,
        carbs: 35,
        fats: 20,
        instructions: "Blueberries are rich in antioxidants for brain health."
      },
      {
        name: "Mid-Morning Snack",
        time: "10:30 AM",
        items: ["Dark chocolate (1 oz)", "Green tea"],
        calories: 150,
        protein: 2,
        carbs: 12,
        fats: 10,
        instructions: "Choose dark chocolate with 70% or higher cocoa content."
      },
      {
        name: "Lunch",
        time: "1:00 PM",
        items: ["Salmon salad with spinach", "Quinoa", "Olive oil dressing"],
        calories: 500,
        protein: 35,
        carbs: 30,
        fats: 22,
        instructions: "Salmon provides DHA for brain function."
      },
      {
        name: "Afternoon Snack",
        time: "3:30 PM",
        items: ["Mixed nuts and seeds", "Fresh berries"],
        calories: 180,
        protein: 6,
        carbs: 12,
        fats: 14,
        instructions: "Nuts provide vitamin E and healthy fats."
      },
      {
        name: "Dinner",
        time: "6:30 PM",
        items: ["Herb-roasted chicken", "Roasted Brussels sprouts", "Sweet potato"],
        calories: 420,
        protein: 38,
        carbs: 32,
        fats: 12,
        instructions: "Cruciferous vegetables support brain detoxification."
      }
    ],
    restrictions: ["Limit alcohol completely", "Avoid processed meats", "Reduce refined sugars"],
    supplements: [
      { name: "Omega-3 DHA", dosage: "1500mg daily", timing: "With dinner", reason: "Brain function and neural healing" },
      { name: "B-Complex", dosage: "1 tablet daily", timing: "With breakfast", reason: "Nerve function and energy metabolism" },
      { name: "Magnesium", dosage: "400mg daily", timing: "Before bedtime", reason: "Nerve function and sleep quality" }
    ],
    specialInstructions: [
      "Include brain-healthy foods daily: berries, nuts, fish",
      "Stay well-hydrated for optimal brain function",
      "Eat regular meals to maintain stable blood sugar",
      "Consider meal timing to support circadian rhythms"
    ]
  },
  {
    name: "General Surgery Recovery Diet",
    description: "Balanced nutrition plan for general surgery patients focusing on wound healing, immune support, and gradual return to normal diet.",
    surgeryType: "General",
    phase: "Phase 2",
    duration: "4 weeks",
    dailyCalories: 1600,
    dailyProtein: 80,
    meals: [
      {
        name: "Breakfast",
        time: "7:30 AM",
        items: ["Scrambled eggs", "Whole grain toast", "Orange juice"],
        calories: 320,
        protein: 20,
        carbs: 30,
        fats: 12,
        instructions: "Eggs provide complete protein for healing."
      },
      {
        name: "Mid-Morning Snack",
        time: "10:00 AM",
        items: ["Yogurt with honey", "Granola"],
        calories: 160,
        protein: 8,
        carbs: 25,
        fats: 4,
        instructions: "Probiotics support digestive health."
      },
      {
        name: "Lunch",
        time: "12:30 PM",
        items: ["Turkey sandwich", "Vegetable soup", "Side salad"],
        calories: 420,
        protein: 25,
        carbs: 45,
        fats: 12,
        instructions: "Include vegetables for vitamins and minerals."
      },
      {
        name: "Afternoon Snack",
        time: "3:30 PM",
        items: ["Cheese and crackers", "Apple slices"],
        calories: 180,
        protein: 8,
        carbs: 20,
        fats: 8,
        instructions: "Balanced snack to maintain energy."
      },
      {
        name: "Dinner",
        time: "6:30 PM",
        items: ["Grilled chicken breast", "Rice pilaf", "Green beans"],
        calories: 380,
        protein: 35,
        carbs: 35,
        fats: 8,
        instructions: "Lean protein supports tissue repair."
      }
    ],
    restrictions: ["Limit high-fat foods initially", "Avoid spicy foods", "No alcohol during recovery"],
    supplements: [
      { name: "Multivitamin", dosage: "1 tablet daily", timing: "With breakfast", reason: "Overall nutritional support" },
      { name: "Vitamin C", dosage: "250mg daily", timing: "With lunch", reason: "Wound healing support" }
    ],
    specialInstructions: [
      "Gradually increase portion sizes as tolerated",
      "Eat slowly and chew thoroughly",
      "Stay hydrated with water throughout the day",
      "Report any digestive issues to healthcare team"
    ]
  }
];

const exercisePlanTemplates = [
  {
    name: "Post-Bariatric Surgery Gentle Movement",
    description: "Low-impact exercise program designed for bariatric surgery patients focusing on gradual mobility improvement and core strength.",
    surgeryType: "Bariatric",
    phase: "Phase 1",
    intensity: "Low",
    duration: "8 weeks",
    exercises: [
      {
        name: "Walking",
        type: "Cardio",
        duration: "10-15 minutes",
        sets: 1,
        reps: null,
        instructions: "Start with 5 minutes and gradually increase. Walk on flat surface.",
        equipment: ["Comfortable walking shoes"],
        targetMuscles: ["Legs", "Core"]
      },
      {
        name: "Deep Breathing",
        type: "Breathing",
        duration: "5 minutes",
        sets: 3,
        reps: 10,
        instructions: "Inhale for 4 counts, hold for 4, exhale for 6. Helps prevent complications.",
        equipment: [],
        targetMuscles: ["Diaphragm", "Core"]
      },
      {
        name: "Ankle Circles",
        type: "Flexibility",
        duration: "2 minutes",
        sets: 2,
        reps: 10,
        instructions: "Rotate ankles clockwise and counterclockwise to improve circulation.",
        equipment: [],
        targetMuscles: ["Calves", "Ankles"]
      },
      {
        name: "Wall Push-ups",
        type: "Strength",
        duration: "3 minutes",
        sets: 2,
        reps: 8,
        instructions: "Stand arm's length from wall, push against wall gently.",
        equipment: [],
        targetMuscles: ["Arms", "Chest", "Core"]
      }
    ],
    weeklyTargets: {
      totalSteps: 3500,
      activeMinutes: 90,
      exerciseSessions: 5,
      caloriesBurn: 200
    },
    restrictions: ["No heavy lifting over 10 lbs", "Avoid abdominal exercises initially"],
    precautions: ["Stop if feeling dizzy", "Avoid dehydration", "Listen to your body"]
  },
  {
    name: "Cardiac Rehabilitation Phase I",
    description: "Supervised low-intensity exercise program for cardiac surgery patients to improve cardiovascular fitness and strength gradually.",
    surgeryType: "Cardiac",
    phase: "Phase 1",
    intensity: "Low",
    duration: "6 weeks",
    exercises: [
      {
        name: "Chair Exercises",
        type: "Strength",
        duration: "15 minutes",
        sets: 3,
        reps: 12,
        instructions: "Seated arm raises, leg extensions, and gentle twists.",
        equipment: ["Chair", "Light weights (1-2 lbs)"],
        targetMuscles: ["Arms", "Legs", "Core"]
      },
      {
        name: "Slow Walking",
        type: "Cardio",
        duration: "10 minutes",
        sets: 1,
        reps: null,
        instructions: "Walk slowly on level surface, monitor heart rate.",
        equipment: ["Heart rate monitor"],
        targetMuscles: ["Legs", "Heart"]
      },
      {
        name: "Range of Motion",
        type: "Flexibility",
        duration: "10 minutes",
        sets: 2,
        reps: 10,
        instructions: "Gentle shoulder and arm movements to prevent stiffness.",
        equipment: [],
        targetMuscles: ["Shoulders", "Arms"]
      },
      {
        name: "Balance Exercises",
        type: "Balance",
        duration: "5 minutes",
        sets: 3,
        reps: 5,
        instructions: "Stand on one foot for 10 seconds, use support if needed.",
        equipment: ["Chair for support"],
        targetMuscles: ["Core", "Legs"]
      }
    ],
    weeklyTargets: {
      totalSteps: 2800,
      activeMinutes: 120,
      exerciseSessions: 6,
      caloriesBurn: 180
    },
    restrictions: ["Heart rate should not exceed prescribed limit", "No lifting over 5 lbs"],
    precautions: ["Monitor blood pressure", "Stop if chest pain occurs", "Stay within target heart rate zone"]
  },
  {
    name: "Orthopedic Joint Recovery Program",
    description: "Targeted exercise program for orthopedic surgery patients focusing on joint mobility, strength, and functional movement patterns.",
    surgeryType: "Orthopedic",
    phase: "Phase 2",
    intensity: "Moderate",
    duration: "12 weeks",
    exercises: [
      {
        name: "Physical Therapy Exercises",
        type: "Strength",
        duration: "20 minutes",
        sets: 3,
        reps: 15,
        instructions: "Specific exercises targeting affected joint as prescribed by PT.",
        equipment: ["Resistance bands", "Light weights"],
        targetMuscles: ["Targeted joint area"]
      },
      {
        name: "Pool Walking",
        type: "Cardio",
        duration: "15 minutes",
        sets: 1,
        reps: null,
        instructions: "Water walking reduces joint stress while providing resistance.",
        equipment: ["Pool access"],
        targetMuscles: ["Legs", "Core"]
      },
      {
        name: "Gentle Stretching",
        type: "Flexibility",
        duration: "15 minutes",
        sets: 2,
        reps: 8,
        instructions: "Hold stretches for 30 seconds, don't force movement.",
        equipment: ["Yoga mat"],
        targetMuscles: ["All major muscle groups"]
      },
      {
        name: "Balance Training",
        type: "Balance",
        duration: "10 minutes",
        sets: 3,
        reps: 10,
        instructions: "Standing on unstable surfaces to improve proprioception.",
        equipment: ["Balance pad"],
        targetMuscles: ["Core", "Stabilizing muscles"]
      }
    ],
    weeklyTargets: {
      totalSteps: 5000,
      activeMinutes: 180,
      exerciseSessions: 5,
      caloriesBurn: 300
    },
    restrictions: ["Follow weight-bearing restrictions", "Avoid high-impact activities"],
    precautions: ["Ice after exercise if swelling", "Don't exercise through pain", "Follow PT guidelines"]
  },
  {
    name: "Neurological Recovery Coordination Training",
    description: "Specialized exercise program for neurological surgery patients emphasizing coordination, balance, and cognitive-motor integration.",
    surgeryType: "Neurological",
    phase: "Phase 2",
    intensity: "Low",
    duration: "16 weeks",
    exercises: [
      {
        name: "Cognitive-Motor Tasks",
        type: "Balance",
        duration: "15 minutes",
        sets: 3,
        reps: 10,
        instructions: "Simple tasks combining thinking and movement (counting while walking).",
        equipment: [],
        targetMuscles: ["Brain", "Coordination"]
      },
      {
        name: "Tai Chi Movements",
        type: "Flexibility",
        duration: "20 minutes",
        sets: 1,
        reps: null,
        instructions: "Slow, controlled movements to improve balance and coordination.",
        equipment: [],
        targetMuscles: ["Full body", "Core"]
      },
      {
        name: "Hand-Eye Coordination",
        type: "Strength",
        duration: "10 minutes",
        sets: 3,
        reps: 15,
        instructions: "Catching balls, stacking objects, writing exercises.",
        equipment: ["Tennis balls", "Building blocks"],
        targetMuscles: ["Hands", "Arms", "Brain"]
      },
      {
        name: "Stationary Bike",
        type: "Cardio",
        duration: "12 minutes",
        sets: 1,
        reps: null,
        instructions: "Low resistance cycling to improve cardiovascular fitness safely.",
        equipment: ["Stationary bike"],
        targetMuscles: ["Legs", "Heart"]
      }
    ],
    weeklyTargets: {
      totalSteps: 4000,
      activeMinutes: 150,
      exerciseSessions: 4,
      caloriesBurn: 250
    },
    restrictions: ["Avoid activities with fall risk", "No contact sports"],
    precautions: ["Have supervision initially", "Monitor for dizziness", "Progress slowly"]
  },
  {
    name: "General Surgery Recovery Fitness",
    description: "Comprehensive exercise program for general surgery patients to restore overall fitness and functional capacity progressively.",
    surgeryType: "General",
    phase: "Phase 3",
    intensity: "Moderate",
    duration: "8 weeks",
    exercises: [
      {
        name: "Brisk Walking",
        type: "Cardio",
        duration: "25 minutes",
        sets: 1,
        reps: null,
        instructions: "Maintain conversation pace, increase duration weekly.",
        equipment: ["Walking shoes"],
        targetMuscles: ["Legs", "Heart", "Core"]
      },
      {
        name: "Bodyweight Exercises",
        type: "Strength",
        duration: "20 minutes",
        sets: 3,
        reps: 12,
        instructions: "Squats, lunges, modified push-ups as tolerated.",
        equipment: [],
        targetMuscles: ["Full body"]
      },
      {
        name: "Core Strengthening",
        type: "Strength",
        duration: "15 minutes",
        sets: 3,
        reps: 10,
        instructions: "Planks, bird dogs, gentle crunches after clearance.",
        equipment: ["Exercise mat"],
        targetMuscles: ["Core", "Back"]
      },
      {
        name: "Flexibility Training",
        type: "Flexibility",
        duration: "15 minutes",
        sets: 1,
        reps: 8,
        instructions: "Full body stretching routine, hold each stretch 30 seconds.",
        equipment: ["Yoga mat"],
        targetMuscles: ["All major muscle groups"]
      }
    ],
    weeklyTargets: {
      totalSteps: 7000,
      activeMinutes: 210,
      exerciseSessions: 5,
      caloriesBurn: 400
    },
    restrictions: ["Follow lifting restrictions", "Gradually increase intensity"],
    precautions: ["Stop if incision pain", "Stay hydrated", "Get adequate rest between sessions"]
  }
];

async function seedDietExercisePlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curavia');
    console.log('Connected to MongoDB');

    // Find a system user (admin) to assign as creator
    let systemUser = await User.findOne({ role: 'super_admin' });
    if (!systemUser) {
      // Create a system user if none exists
      systemUser = new User({
        name: 'System Administrator',
        email: 'system@curavia.com',
        password: 'system123',
        role: 'super_admin',
        isEmailVerified: true
      });
      await systemUser.save();
    }

    // Clear existing templates
    await DietPlanTemplate.deleteMany({});
    await ExercisePlanTemplate.deleteMany({});
    console.log('Cleared existing templates');

    // Add createdBy to all templates
    const dietPlansWithCreator = dietPlanTemplates.map(plan => ({
      ...plan,
      createdBy: systemUser._id
    }));

    const exercisePlansWithCreator = exercisePlanTemplates.map(plan => ({
      ...plan,
      createdBy: systemUser._id
    }));

    // Insert diet plan templates
    const insertedDietPlans = await DietPlanTemplate.insertMany(dietPlansWithCreator);
    console.log(`✅ Inserted ${insertedDietPlans.length} diet plan templates`);

    // Insert exercise plan templates
    const insertedExercisePlans = await ExercisePlanTemplate.insertMany(exercisePlansWithCreator);
    console.log(`✅ Inserted ${insertedExercisePlans.length} exercise plan templates`);

    console.log('\n🎉 Successfully seeded diet and exercise plan templates!');
    console.log('\nTemplates created:');
    console.log('Diet Plans:');
    insertedDietPlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.name} (${plan.surgeryType} - ${plan.phase})`);
    });
    console.log('\nExercise Plans:');
    insertedExercisePlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.name} (${plan.surgeryType} - ${plan.intensity})`);
    });

  } catch (error) {
    console.error('❌ Error seeding diet exercise plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDietExercisePlans();
}

module.exports = { seedDietExercisePlans };