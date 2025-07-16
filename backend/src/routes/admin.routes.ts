import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { scheduledTasksService } from '../services/scheduledTasks.service';
import { reminderService } from '../services/reminder.service';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Get scheduled tasks status
router.get('/scheduled-tasks/status', async (req, res) => {
  try {
    const status = scheduledTasksService.getStatus();
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get scheduled tasks status'
    });
  }
});

// Get reminder statistics
router.get('/reminders/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const stats = await reminderService.getReminderStats(days);
    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reminder statistics'
    });
  }
});

// Manually trigger a reminder for testing
router.post('/reminders/test/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { minutesFromNow = 1 } = req.body;

    // Schedule a reminder for X minutes from now
    const reminderTime = new Date(Date.now() + minutesFromNow * 60 * 1000);
    await reminderService.scheduleCustomReminder(bookingId, reminderTime, 'both');

    res.json({
      status: 'success',
      message: `Test reminder scheduled for ${reminderTime.toISOString()}`
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to schedule test reminder'
    });
  }
});

export default router;