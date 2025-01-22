-- Add policy to allow any authenticated user to delete assignments
CREATE POLICY "Users can delete assignments"
    ON public.ticket_assignments FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Add policy to allow any authenticated user to create history records
CREATE POLICY "Users can create history records"
    ON public.ticket_history FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Grant insert permission on ticket_history to authenticated users
GRANT INSERT ON public.ticket_history TO authenticated; 