const express = require('express');
const router = express.Router();
const DietPlan = require('../models/DietPlan');
const ExercisePlan = require('../models/ExercisePlan');
const DietPlanTemplate = require('../models/DietPlanTemplate');
const ExercisePlanTemplate = require('../models/ExercisePlanTemplate');
const User = require('../models/User');
const { authenticate, requireDoctorOrSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/diet-exercise/diet-plans
 * @desc    Get all diet plan templates
 * @access  Private (Doctor/Admin)
 */
router.get('/diet-plans', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const dietPlans = await DietPlanTemplate.find()
      .populate('createdBy', 'name role')
      .populate('assignedPatients', 'name patientId')
      .sort({ createdAt: -1 });

    // Format diet plans for frontend
    const formattedPlans = dietPlans.map(plan => ({
      id: plan._id,
      name: plan.name,
      surgeryType: plan.surgeryType || 'General',
      phase: plan.phase || 'Phase 1',
      duration: plan.duration || '4 weeks',
      calories: plan.dailyCalories || 0,
      protein: plan.dailyProtein || 0,
      assignedPatients: plan.assignedPatients?.length || 0,
      status: plan.isActive ? 'active' : 'inactive',
      createdBy: plan.createdBy?.name || 'System',
      description: plan.description || '',
      meals: plan.meals || []
    }));

    res.json({ dietPlans: formattedPlans });
  } catch (error) {
    console.error('Get diet plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/diet-exercise/exercise-plans
 * @desc    Get all exercise plan templates
 * @access  Private (Doctor/Admin)
 */
router.get('/exercise-plans', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const exercisePlans = await ExercisePlanTemplate.find()
      .populate('createdBy', 'name role')
      .populate('assignedPatients', 'name patientId')
      .sort({ createdAt: -1 });

    // Format exercise plans for frontend
    const formattedPlans = exercisePlans.map(plan => ({
      id: plan._id,
      name: plan.name,
      surgeryType: plan.surgeryType || 'General',
      phase: plan.phase || 'Phase 1',
      duration: plan.duration || '4 weeks',
      intensity: plan.intensity || 'Low',
      assignedPatients: plan.assignedPatients?.length || 0,
      status: plan.isActive ? 'active' : 'inactive',
      createdBy: plan.createdBy?.name || 'System',
      description: plan.description || '',
      exercises: plan.exercises || []
    }));

    res.json({ exercisePlans: formattedPlans });
  } catch (error) {
    console.error('Get exercise plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/diet-exercise/diet-plans
 * @desc    Create a new diet plan template
 * @access  Private (Doctor/Admin)
 */
router.post('/diet-plans', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      surgeryType,
      phase,
      duration,
      dailyCalories,
      dailyProtein,
      meals,
      nutritionalGuidelines,
      restrictions,
      supplements,
      specialInstructions,
      assignedPatients
    } = req.body;

    const dietPlan = new DietPlanTemplate({
      name,
      description,
      surgeryType,
      phase,
      duration,
      dailyCalories,
      dailyProtein,
      meals,
      nutritionalGuidelines,
      restrictions,
      supplements,
      specialInstructions,
      assignedPatients: assignedPatients || [],
      createdBy: req.user._id,
      isActive: true
    });

    await dietPlan.save();

    res.status(201).json({
      message: 'Diet plan template created successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Create diet plan template error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/diet-exercise/exercise-plans
 * @desc    Create a new exercise plan template
 * @access  Private (Doctor/Admin)
 */
router.post('/exercise-plans', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      surgeryType,
      phase,
      duration,
      intensity,
      exercises,
      weeklyTargets,
      restrictions,
      precautions,
      progressMilestones,
      assignedPatients
    } = req.body;

    const exercisePlan = new ExercisePlanTemplate({
      name,
      description,
      surgeryType,
      phase,
      duration,
      intensity,
      exercises,
      weeklyTargets,
      restrictions,
      precautions,
      progressMilestones,
      assignedPatients: assignedPatients || [],
      createdBy: req.user._id,
      isActive: true
    });

    await exercisePlan.save();

    res.status(201).json({
      message: 'Exercise plan template created successfully',
      exercisePlan
    });
  } catch (error) {
    console.error('Create exercise plan template error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/diet-exercise/diet-plans/:id
 * @desc    Update a diet plan
 * @access  Private (Doctor/Admin)
 */
router.put('/diet-plans/:id', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dietPlan = await DietPlan.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    res.json({
      message: 'Diet plan updated successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Update diet plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/diet-exercise/exercise-plans/:id
 * @desc    Update an exercise plan
 * @access  Private (Doctor/Admin)
 */
router.put('/exercise-plans/:id', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const exercisePlan = await ExercisePlan.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!exercisePlan) {
      return res.status(404).json({ error: 'Exercise plan not found' });
    }

    res.json({
      message: 'Exercise plan updated successfully',
      exercisePlan
    });
  } catch (error) {
    console.error('Update exercise plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/diet-exercise/diet-plans/:id
 * @desc    Delete a diet plan
 * @access  Private (Doctor/Admin)
 */
router.delete('/diet-plans/:id', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const dietPlan = await DietPlan.findByIdAndDelete(id);

    if (!dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    res.json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('Delete diet plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/diet-exercise/exercise-plans/:id
 * @desc    Delete an exercise plan
 * @access  Private (Doctor/Admin)
 */
router.delete('/exercise-plans/:id', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const exercisePlan = await ExercisePlan.findByIdAndDelete(id);

    if (!exercisePlan) {
      return res.status(404).json({ error: 'Exercise plan not found' });
    }

    res.json({ message: 'Exercise plan deleted successfully' });
  } catch (error) {
    console.error('Delete exercise plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/diet-exercise/statistics
 * @desc    Get diet and exercise statistics
 * @access  Private (Doctor/Admin)
 */
router.get('/statistics', authenticate, requireDoctorOrSuperAdmin, async (req, res) => {
  try {
    const [
      totalDietPlans,
      activeDietPlans,
      totalExercisePlans,
      activeExercisePlans,
      totalAssignedPatients
    ] = await Promise.all([
      DietPlanTemplate.countDocuments(),
      DietPlanTemplate.countDocuments({ isActive: true }),
      ExercisePlanTemplate.countDocuments(),
      ExercisePlanTemplate.countDocuments({ isActive: true }),
      // Count unique patients assigned to any plan
      DietPlanTemplate.aggregate([
        { $unwind: '$assignedPatients' },
        { $group: { _id: '$assignedPatients' } },
        { $count: 'count' }
      ])
    ]);

    res.json({
      dietPlans: {
        total: totalDietPlans,
        active: activeDietPlans
      },
      exercisePlans: {
        total: totalExercisePlans,
        active: activeExercisePlans
      },
      assignedPatients: totalAssignedPatients[0]?.count || 0
    });
  } catch (error) {
    console.error('Get diet exercise statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;