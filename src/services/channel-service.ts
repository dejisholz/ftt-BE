import fetch from 'node-fetch';
import { TELEGRAM_API_URL } from '../config/constants';

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@your_channel';  // Replace with your channel ID

interface InviteLink {
  invite_link: string;
  creator: {
    id: number;
  };
  creates_join_request: boolean;
  is_primary: boolean;
  is_revoked: boolean;
}

export const createInviteLink = async (userId: number): Promise<string> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/createChatInviteLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        name: `user_${userId}`,  // To identify which user this link was created for
        creates_join_request: false,
        member_limit: 1  // Only one person can use this link
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create invite link: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result.invite_link;
  } catch (error) {
    console.error('Error creating invite link:', error);
    throw error;
  }
};

export const revokeInviteLink = async (inviteLink: string): Promise<void> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/revokeChatInviteLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        invite_link: inviteLink,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke invite link: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error revoking invite link:', error);
    throw error;
  }
};

export const checkUserInChannel = async (userId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getChatMember`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return ['member', 'administrator', 'creator'].includes(data.result.status);
  } catch (error) {
    console.error('Error checking user membership:', error);
    return false;
  }
}; 