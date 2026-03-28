"use client";

import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
	onLoadMore: () => void,
	{
		hasMore,
		loading,
		threshold = 300,
	}: { hasMore: boolean; loading: boolean; threshold?: number },
) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	const handleIntersection = useCallback(
		(entries: IntersectionObserverEntry[]) => {
			if (entries[0]?.isIntersecting && hasMore && !loading) {
				onLoadMore();
			}
		},
		[onLoadMore, hasMore, loading],
	);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(handleIntersection, {
			rootMargin: `0px 0px ${threshold}px 0px`,
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [handleIntersection, threshold]);

	return sentinelRef;
}
