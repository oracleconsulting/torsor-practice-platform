import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../lib/supabase/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    practiceId: string;
    role: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get practice details for the user
    const { data: practiceUser } = await supabase
      .from('practice_users')
      .select('practice_id, role')
      .eq('user_id', user.id)
      .single();

    if (!practiceUser) {
      return res.status(403).json({ error: 'User not associated with a practice' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      practiceId: practiceUser.practice_id,
      role: practiceUser.role
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
} 