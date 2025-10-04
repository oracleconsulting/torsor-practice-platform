import { BoardStatus } from '@/utils/supabaseHelpers';

export class BoardService {
  private static apiUrl = 'https://oracle-api-server-0vhz.onrender.com';
  private static apiKey = 'ZKSRzCoMHepQu79yshK2G3I5AnrCP2yGelRjmMBxQec';

  static async getBoardStatus(groupId: string): Promise<BoardStatus> {
    try {
      const response = await fetch(`${this.apiUrl}/api/board/status/${groupId}`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch board status');
      }

      const data = await response.json();
      
      return {
        accepted: data.accepted || false,
        accepted_at: data.accepted_at || null,
        board_members: Array.isArray(data.board_members) ? data.board_members : [],
        ready: data.ready || false
      };
    } catch (error) {
      console.error('Board service error:', error);
      throw error;
    }
  }

  static async acceptBoard(params: {
    groupId: string;
    accepted: boolean;
    userEmail: string;
  }): Promise<{ status: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/board/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to accept board');
      }

      return await response.json();
    } catch (error) {
      console.error('Board acceptance error:', error);
      throw error;
    }
  }
}

export const boardService = BoardService;
