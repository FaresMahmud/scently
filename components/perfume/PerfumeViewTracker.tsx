"use client"

import { useEffect } from "react"
import { track } from "@/lib/analytics-client"

interface Props {
  perfumeId: string
  nome: string
  marca: string
}

export default function PerfumeViewTracker({ perfumeId, nome, marca }: Props) {
  useEffect(() => {
    track("perfume_viewed", { perfumeId, nome, marca })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfumeId])

  return null
}
