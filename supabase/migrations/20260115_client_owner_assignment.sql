-- ============================================================================
-- CLIENT OWNER ASSIGNMENT
-- ============================================================================
-- Adds client_owner_id to practice_members to assign clients to staff members
-- Staff members ("client owners") can then manage documents/context for their clients
-- ============================================================================

-- Add client_owner_id column to practice_members
ALTER TABLE practice_members 
ADD COLUMN IF NOT EXISTS client_owner_id UUID REFERENCES practice_members(id);

-- Add index for quick lookup of clients by owner
CREATE INDEX IF NOT EXISTS idx_practice_members_client_owner 
ON practice_members(client_owner_id) 
WHERE member_type = 'client';

-- Comment for documentation
COMMENT ON COLUMN practice_members.client_owner_id IS 'Staff member who owns/manages this client. Only applicable for member_type=client';

-- Create a view for staff to see their assigned clients
CREATE OR REPLACE VIEW staff_client_assignments AS
SELECT 
  c.id AS client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.client_company,
  c.practice_id,
  c.program_status,
  c.created_at,
  o.id AS owner_id,
  o.name AS owner_name,
  o.email AS owner_email
FROM practice_members c
LEFT JOIN practice_members o ON c.client_owner_id = o.id
WHERE c.member_type = 'client';

-- Grant access to authenticated users
GRANT SELECT ON staff_client_assignments TO authenticated;

-- Function to assign a client to a staff owner
CREATE OR REPLACE FUNCTION assign_client_to_owner(
  p_client_id UUID,
  p_owner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client RECORD;
  v_owner RECORD;
  v_result JSONB;
BEGIN
  -- Verify client exists and is a client
  SELECT * INTO v_client FROM practice_members WHERE id = p_client_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client not found');
  END IF;
  IF v_client.member_type != 'client' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member is not a client');
  END IF;
  
  -- Verify owner exists and is staff (not a client)
  SELECT * INTO v_owner FROM practice_members WHERE id = p_owner_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Owner not found');
  END IF;
  IF v_owner.member_type = 'client' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Owner cannot be a client');
  END IF;
  
  -- Verify same practice
  IF v_client.practice_id != v_owner.practice_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client and owner must be in same practice');
  END IF;
  
  -- Perform the assignment
  UPDATE practice_members
  SET client_owner_id = p_owner_id, updated_at = NOW()
  WHERE id = p_client_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'client_id', p_client_id,
    'owner_id', p_owner_id,
    'client_name', v_client.name,
    'owner_name', v_owner.name
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION assign_client_to_owner(UUID, UUID) TO authenticated;

-- Function to unassign a client from their owner
CREATE OR REPLACE FUNCTION unassign_client_owner(p_client_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE practice_members
  SET client_owner_id = NULL, updated_at = NOW()
  WHERE id = p_client_id AND member_type = 'client';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'client_id', p_client_id);
END;
$$;

GRANT EXECUTE ON FUNCTION unassign_client_owner(UUID) TO authenticated;

-- RLS policy: Staff can only see/manage clients in their practice
-- (This leverages existing practice-level RLS)

