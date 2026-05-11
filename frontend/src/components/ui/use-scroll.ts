"use client"

import React from "react"

export function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false)

  const onScroll = React.useCallback(() => {
    const main = document.querySelector("main")
    const mainScrollTop = main instanceof HTMLElement ? main.scrollTop : 0

    setScrolled(window.scrollY > threshold || mainScrollTop > threshold)
  }, [threshold])

  React.useEffect(() => {
    const main = document.querySelector("main")

    window.addEventListener("scroll", onScroll)
    main?.addEventListener("scroll", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      main?.removeEventListener("scroll", onScroll)
    }
  }, [onScroll])

  React.useEffect(() => {
    onScroll()
  }, [onScroll])

  return scrolled
}
