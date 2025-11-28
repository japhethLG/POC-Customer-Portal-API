/**
 * Message Controller
 *
 * Thin controller that delegates to MessageService.
 * Handles HTTP concerns only (request/response).
 */

import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { messageService } from '../services/message.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AuthRequest } from '../types';

export class MessageController {
  /**
   * Get all messages for a specific booking
   * GET /api/messages/:jobId
   */
  static getMessages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const customerId = req.customerId!;

    const messages = await messageService.getMessages(jobId, customerId);

    sendSuccess(res, messages);
  });

  /**
   * Send a message for a specific booking
   * POST /api/messages/:jobId
   */
  static sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { jobId } = req.params;
    const { message } = req.body;
    const customerId = req.customerId!;

    const newMessage = await messageService.sendMessage(jobId, customerId, message);

    sendCreated(res, newMessage, 'Message sent successfully');
  });
}
