'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import PostCard from '@/components/posts/PostCard'
import type { Post } from '@/types'

export default function PostPage() {
  const params = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      if (!params?.id) return

      setLoading(true)
      try {
        const response = await fetch(`/api/posts/${params.id}`)
        const json = await response.json()
        if (json.data) {
          setPost(json.data)
        } else {
          setPost(null)
        }
      } catch {
        setPost(null)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [params?.id])

  return (
    <div className="feed-page">
      <Topbar title="Publicação" />
      <div className="feed-body">
        <div className="feed-col">
          {loading ? (
            <div className="feed-loading-state"><Loader2 size={24} className="spin" /></div>
          ) : !post ? (
            <p className="feed-empty-state">Publicação não encontrada.</p>
          ) : (
            <div className="feed-posts">
              <PostCard post={post} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
