const express = require('express');
const router = express.Router();
const Outlet = require('../models/Outlet');

// @desc    Get all outlets
// @route   GET /api/outlets
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const outlets = await Outlet.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: outlets.length,
      data: outlets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get single outlet
// @route   GET /api/outlets/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Create new outlet
// @route   POST /api/outlets
// @access  Public
router.post('/', async (req, res) => {
  try {
    const outlet = await Outlet.create(req.body);

    res.status(201).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Outlet code already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Update outlet
// @route   PUT /api/outlets/:id
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!outlet) {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }

    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Outlet code already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Delete outlet
// @route   DELETE /api/outlets/:id
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    await outlet.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Outlet deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Outlet not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get outlet statistics
// @route   GET /api/outlets/stats/overview
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalOutlets = await Outlet.countDocuments();
    const activeOutlets = await Outlet.countDocuments({ status: 'active' });
    const inactiveOutlets = await Outlet.countDocuments({ status: 'inactive' });
    const maintenanceOutlets = await Outlet.countDocuments({ status: 'maintenance' });

    const typeStats = await Outlet.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalOutlets,
        active: activeOutlets,
        inactive: inactiveOutlets,
        maintenance: maintenanceOutlets,
        byType: typeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;