import {useEffect} from 'react';
import {
  markCartActionPending,
  markCartActionSettled,
} from '~/lib/cartActionSignal';

/**
 * Mount inside a CartForm's fetcher render-prop (`{(fetcher) => ...}`) to
 * track its lifecycle for cartActionSignal — see that file for why this
 * tracks the actual mutation instead of a fixed timestamp, and for how this
 * was verified live to also cover root's deferred cart re-fetch, not just
 * this fetcher's own action.
 */
export function CartActionTracker({
  state,
}: {
  state: 'idle' | 'submitting' | 'loading';
}) {
  useEffect(() => {
    if (state === 'idle') return;
    markCartActionPending();
    return () => markCartActionSettled();
  }, [state]);

  return null;
}
