import { Request, Response } from 'express';
import { sendMessage } from '../services/telegram-service';
import { TelegramUpdate, InlineKeyboardMarkup } from '../types/telegram-types';
import { getPaymentWindowStatus } from '../utils/payment-window';
import { BOT_LINK, FRONTEND_PAYMENT_URL } from '../config/constants';
import { createInviteLink, checkUserInChannel, revokeInviteLink } from '../services/channel-service';
import { verifyUSDTTransaction } from '../services/tron-service';

export const handleUpdate = async (req: Request, res: Response) => {
  try {
    const update: TelegramUpdate = req.body;
    console.log('Received update:', JSON.stringify(update, null, 2));  // Log the update for debugging

    // Handle callback queries
    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const userId = update.callback_query.from.id;

      if (callbackData === 'join_channel') {
        try {
          // Check if user is already in channel
          const isInChannel = await checkUserInChannel(userId);
          
          if (isInChannel) {
            await sendMessage({
              chat_id: Number(userId),  // Ensure chat_id is a number
              text: 'You are already a member of the channel! 🎉',
            });
            return;
          }

          // Create a unique invite link for this user
          const inviteLink = await createInviteLink(userId);

          // Send the invite link to the user
          await sendMessage({
            chat_id: Number(userId),  // Ensure chat_id is a number
            text: `Here's your exclusive invite link to join our VIP channel! 🎉\n\nThis link will only work for you and can only be used once. NOTE: You must join the channel within 24 hours of receiving this link.\n\n${inviteLink}`,
          });

          // Set up an interval to check if user has joined
          const checkInterval = setInterval(async () => {
            try {
              const hasJoined = await checkUserInChannel(userId);
              if (hasJoined) {
                // User has joined, revoke the link
                await revokeInviteLink(inviteLink);
                await sendMessage({
                  chat_id: Number(userId),  // Ensure chat_id is a number
                  text: 'Successfully joined the channel! Welcome aboard! 🎉',
                });
                clearInterval(checkInterval);
              }
            } catch (error) {
              console.error('Error checking channel membership:', error);
              clearInterval(checkInterval);  // Clear interval on error to prevent continuous failing checks
            }
          }, 10000);

          // Clear interval after 5 minutes if user hasn't joined
          setTimeout(async () => {
            clearInterval(checkInterval);
            try {
              await revokeInviteLink(inviteLink);
              await sendMessage({
                chat_id: Number(userId),  // Ensure chat_id is a number
                text: 'Your invite link has expired. Please request a new one if you still want to join.',
              });
            } catch (error) {
              console.error('Error handling expired invite:', error);
            }
          }, 86400000); // 24 hours (24 * 60 * 60 * 1000 ms)
        } catch (error) {
          console.error('Error handling channel join:', error);
          await sendMessage({
            chat_id: Number(userId),  // Ensure chat_id is a number
            text: 'Sorry, there was an error generating your invite link. Please try again later.',
          });
        }
      } else if (callbackData === 'payment_verified') {
        try {
          // Check if user is already in channel
          const isInChannel = await checkUserInChannel(userId);
          
          if (isInChannel) {
            await sendMessage({
              chat_id: Number(userId),  // Ensure chat_id is a number
              text: 'You are already a member of the channel! 🎉',
            });
            return res.json({ success: true, message: 'Already a member', isInChannel: true });
          }

          // Create a unique invite link for this user
          const inviteLink = await createInviteLink(userId);

          // Send the invite link to the user via Telegram
          await sendMessage({
            chat_id: Number(userId),  // Ensure chat_id is a number
            text: `🎉 Payment Verified! Here's your exclusive invite link to join our VIP channel!\n\nThis link will only work for you and can only be used once. NOTE: You must join the channel within 24 hours of receiving this link.\n\n${inviteLink}`,
          });

          // Return the invite link to the frontend
          res.json({ 
            success: true, 
            inviteLink,
            message: 'Invite link generated successfully'
          });

          // Set up an interval to check if user has joined
          const checkInterval = setInterval(async () => {
            try {
              const hasJoined = await checkUserInChannel(userId);
              if (hasJoined) {
                // User has joined, revoke the link
                await revokeInviteLink(inviteLink);
                await sendMessage({
                  chat_id: Number(userId),  // Ensure chat_id is a number
                  text: 'Successfully joined the channel! Welcome aboard! 🎉',
                });
                clearInterval(checkInterval);
              }
            } catch (error) {
              console.error('Error checking channel membership:', error);
              clearInterval(checkInterval);
            }
          }, 10000);

          // Clear interval after 24 hours if user hasn't joined
          setTimeout(async () => {
            clearInterval(checkInterval);
            try {
              await revokeInviteLink(inviteLink);
              await sendMessage({
                chat_id: Number(userId),  // Ensure chat_id is a number
                text: 'Your invite link has expired. Please contact support if you still need to join.',
              });
            } catch (error) {
              console.error('Error handling expired invite:', error);
            }
          }, 86400000); // 24 hours

          return;
        } catch (error) {
          console.error('Error handling payment verification:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Error generating invite link'
          });
          return;
        }
      }
    }

    if (update.message?.text) {
      const messageText = update.message.text;
      const chatId = Number(update.message.chat.id);  // Ensure chat_id is a number
      
      if (messageText.startsWith('/start')) {
        const username = update.message.from.username 
          ? `@${update.message.from.username}`
          : update.message.from.first_name;
        
        const userTelegramId = update.message.from.id;
        
        // Check if this is a payment verification start command
        if (messageText.includes('payment_success')) {
          try {
            // Extract transaction hash from the start parameter
            const txHash = messageText.split('payment_success_')[1];
            
            if (!txHash) {
              await sendMessage({
                chat_id: chatId,
                text: '❌ Invalid payment verification link. Please try again or contact support.',
              });
              return res.sendStatus(200);
            }

            // Verify the transaction
            const verificationResult = await verifyUSDTTransaction(txHash);
            
            if (!verificationResult.success) {
              await sendMessage({
                chat_id: chatId,
                text: `❌ Payment verification failed: ${verificationResult.message}`,
              });
              return res.sendStatus(200);
            }

            // Check if user is already in channel
            const isInChannel = await checkUserInChannel(userTelegramId);
            
            if (isInChannel) {
              await sendMessage({
                chat_id: chatId,
                text: 'You are already a member of the channel! 🎉',
              });
              return res.sendStatus(200);
            }

            // Create a unique invite link for this user
            const inviteLink = await createInviteLink(userTelegramId);

            // Send the invite link to the user
            await sendMessage({
              chat_id: chatId,
              text: `🎉 Payment Verified Successfully!\n\nHere's your exclusive invite link to join our VIP channel!\n\nThis link will only work for you and can only be used once. NOTE: You must join the channel within 1 hour of receiving this link.\n\n${inviteLink}`,
            });

            // Set up an interval to check if user has joined
            const checkInterval = setInterval(async () => {
              try {
                const hasJoined = await checkUserInChannel(userTelegramId);
                if (hasJoined) {
                  // User has joined, revoke the link
                  await revokeInviteLink(inviteLink);
                  await sendMessage({
                    chat_id: chatId,
                    text: 'Successfully joined the channel! Welcome aboard! 🎉',
                  });
                  clearInterval(checkInterval);
                }
              } catch (error) {
                console.error('Error checking channel membership:', error);
                clearInterval(checkInterval);
              }
            }, 10000);

            // Clear interval after 1 hour if user hasn't joined
            setTimeout(async () => {
              clearInterval(checkInterval);
              try {
                await revokeInviteLink(inviteLink);
                await sendMessage({
                  chat_id: chatId,
                  text: 'Your invite link has expired. Please contact support if you still need to join.',
                });
              } catch (error) {
                console.error('Error handling expired invite:', error);
              }
            }, 3600000); // 1 hour

            return res.sendStatus(200);
          } catch (error) {
            console.error('Error handling payment verification:', error);
            await sendMessage({
              chat_id: chatId,
              text: '❌ An error occurred while verifying your payment. Please contact support.',
            });
            return res.sendStatus(500);
          }
        }

        const paymentWindow = getPaymentWindowStatus();

        const isOpened = true;
        
        if (paymentWindow.isOpen || isOpened) {
          // Message for open payment window
          const welcomeMessageOpenWindow = `Hello ${username}!\n\nWelcome to FreeTradeTutor Premium membership bot.\n\n✅ Exclusive Content\n✅ Direct Support\n✅ Early Updates\n✅ Community Access\n\nYour Trade Tutor ID: ${userTelegramId}\n\nClick on the link below to complete your registration 👇`;

          // Create inline keyboard markup
          const inlineKeyboard: InlineKeyboardMarkup = {
            inline_keyboard: [[
              {
                text: 'Proceed to Payment 💸',
                url: `${FRONTEND_PAYMENT_URL}/?tgid=${userTelegramId}#payment`  // Replace with your actual frontend URL
              }
            ]]
          };

          await sendMessage({
            chat_id: chatId,
            text: welcomeMessageOpenWindow,
            reply_markup: inlineKeyboard
          });
        } else {
          // Message for closed payment window
          const welcomeMessageClosedWindow = `Hello ${username}!\n\nWelcome to FreeTradeTutor Premium membership bot.\n\n⚠️ Payment Portal Currently Closed ⚠️\n\nPayment Window Information: ⏰\n- Opens: ${paymentWindow.opensOn}\n- Closes: ${paymentWindow.closesOn}\n- Days until window opens: ${paymentWindow.daysUntilOpen} days\n\n✅ Exclusive Content\n✅ Direct Support\n✅ Early Updates\n✅ Community Access\n\nYour Trade Tutor ID: ${userTelegramId}\n\nPlease return during the payment window to complete your registration.`;

          await sendMessage({
            chat_id: chatId,
            text: welcomeMessageClosedWindow,
          });

          // Show reminder for closed window
          await sendMessage({
            chat_id: chatId,
            text: `Reminder: Payment Opens in ${paymentWindow.daysUntilOpen} days 👨‍💻`,
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling update:', error);
    res.sendStatus(500);
  }
}; 