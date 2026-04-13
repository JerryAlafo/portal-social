'use client'

import { useEffect, useRef } from 'react'

type UseInfiniteScrollParams = {
  enabled: boolean
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  rootMargin?: string
}

export function useInfiniteScroll({
  enabled,
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = '300px 0px',
}: UseInfiniteScrollParams) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!enabled || !node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (!hasMore || isLoading) return
        onLoadMore()
      },
      { root: null, rootMargin, threshold: 0.1 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, hasMore, isLoading, onLoadMore, rootMargin])

  return sentinelRef
}
