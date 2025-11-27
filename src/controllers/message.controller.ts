import { Response } from 'express';
import { AuthRequest } from '../types';
import { Message, Job } from '../models';

export class MessageController {
  /**
   * Get all messages for a specific booking
   */
  static async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const customerId = req.customerId;

      // Verify job belongs to customer
      const job = await Job.findOne({ _id: jobId, customerId });
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
        return;
      }

      // Fetch messages
      const messages = await Message.find({ jobId })
        .sort({ createdAt: 1 })
        .lean();

      res.json({
        success: true,
        data: messages.map(msg => ({
          id: msg._id,
          message: msg.message,
          senderType: msg.senderType,
          createdAt: msg.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
      });
    }
  }

  /**
   * Send a message for a specific booking
   */
  static async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const { message } = req.body;
      const customerId = req.customerId;

      // Validate input
      if (!message || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message is required',
        });
        return;
      }

      // Verify job belongs to customer
      const job = await Job.findOne({ _id: jobId, customerId });
      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
        return;
      }

      // Create message
      const newMessage = await Message.create({
        jobId,
        customerId,
        message: message.trim(),
        senderType: 'customer',
      });

      console.log(`💬 New message sent by customer for job ${jobId}`);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          id: newMessage._id,
          message: newMessage.message,
          senderType: newMessage.senderType,
          createdAt: newMessage.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
      });
    }
  }
}

