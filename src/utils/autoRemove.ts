const bot_token = "8121781737:AAGy9kv8kvFjwF1TpODH2lthNcVom6M_EZI";
const channelID = "-1002400975853"; // Add -100 prefix for supergroup/channel IDs
const channelUsername = "@BTradingVIP_Bot";
const bot_username = "BTradingVIP_Bot";
const bot_api = `https://api.telegram.org/bot${bot_token}`;

export interface ChatMember {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  status: string;
}

export interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

/**
 * Fetches all members from a Telegram channel using getChatMembers method
 * 
 * @param botToken - Telegram bot token
 * @param channelId - Channel ID to fetch members from
 * @returns Promise with array of chat members
 */
export async function getChannelMembers(
  botToken: string, 
  channelId: string
): Promise<ChatMember[]> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getChatAdministrators`;
    const params = {
      chat_id: channelId
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data: TelegramResponse<ChatMember[]> = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching channel members:', error);
    throw error;
  }
}

interface UserStatus {
  userId: number;
  status: string;
}

export async function getChannelMembersStatus(
  botToken: string, 
  channelId: string
): Promise<UserStatus[]> {
  try {
    const members = await getChannelMembers(botToken, channelId);
    
    return members.map(member => ({
      userId: member.user.id,
      status: member.status
    }));
  } catch (error) {
    console.error('Error getting channel members status:', error);
    throw error;
  }
}

/**
 * Kicks a user from the channel without banning
 * @param botToken - Telegram bot token
 * @param channelId - Channel ID
 * @param userId - User ID to kick
 */
async function kickUser(
  botToken: string,
  channelId: string,
  userId: number
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/banChatMember`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: channelId,
        user_id: userId,
        until_date: Math.floor(Date.now() / 1000) + 31
      })
    });

    const data: TelegramResponse<boolean> = await response.json();
    
    setTimeout(async () => {
      await fetch(`https://api.telegram.org/bot${botToken}/unbanChatMember`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: channelId,
          user_id: userId,
          only_if_banned: true
        })
      });
    }, 32000);

    return data.ok;
  } catch (error) {
    console.error('Error kicking user:', error);
    return false;
  }
}


/**
 * Removes all users from the channel who are not creators or administrators
 */
export async function removeNonAdminUsers(
    botToken: string = bot_token,
    channelId: string = channelID
  ): Promise<void> {
    try {
      const members = await getChannelMembersStatus(botToken, channelId);
      
      const kickPromises = members
        .filter(member => !['creator', 'administrator'].includes(member.status))
        .map(member => kickUser(botToken, channelId, member.userId));
      
      await Promise.all(kickPromises);
      console.log('Finished removing non-admin users');
    } catch (error) {
      console.error('Error removing non-admin users:', error);
      throw error;
    }
  }

