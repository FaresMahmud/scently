"use client"

import { useState, useEffect } from "react"
import ScannerCamera from "./ScannerCamera"

export default function ScannerWrapper() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    // Desktop = pointer device without touch + wide screen
    const noTouch = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    const wide    = window.innerWidth >= 1024
    setIsDesktop(noTouch && wide)
  }, [])

  // Wait for hydration — avoids layout shift
  if (isDesktop === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          border: "2px solid rgba(245,242,237,0.3)", borderTopColor: "#C4714A",
          animation: "spin 0.6s linear infinite",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return <ScannerCamera isDesktop={isDesktop} />
}
