<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## JanNexus conventions
- Data reads go through `getPlatformData` in `src/lib/jannexus.functions.ts`, consumed via `platformQuery` — one round trip feeds every console route.
- AI extraction lives only in `src/lib/analyze.functions.ts` (Gemini via the Lovable AI Gateway); stated facts and inferences stay separate all the way to the UI.
- Map rendering is client-only in `src/components/demand-map.client.tsx`; `demand-map.tsx` is the SSR-safe wrapper.
