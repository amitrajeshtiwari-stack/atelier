-- Re-apply the comments policies that were lost when an earlier partial
-- apply rolled back around the seed. Idempotent.
drop policy if exists "comments on published posts are readable" on public.comments;
drop policy if exists "authenticated users can comment" on public.comments;
drop policy if exists "authors can edit their own comments" on public.comments;
drop policy if exists "authors can delete their own comments" on public.comments;

create policy "comments on published posts are readable"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.status = 'published' or p.author_id = auth.uid())
    )
    or author_id = auth.uid()
  );
create policy "authenticated users can comment"
  on public.comments for insert with check (auth.uid() = author_id);
create policy "authors can edit their own comments"
  on public.comments for update using (auth.uid() = author_id);
create policy "authors can delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);
