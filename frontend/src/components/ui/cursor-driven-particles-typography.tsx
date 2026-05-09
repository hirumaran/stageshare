import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface CursorDrivenParticleTypographyProps {
  className?: string
  text: string
  fontSize?: number
  fontFamily?: string
  particleSize?: number
  particleDensity?: number
  dispersionStrength?: number
  returnSpeed?: number
  color?: string
  interactive?: boolean
  ambientMotion?: boolean
}

class Particle {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
  size: number
  color: string
  dispersion: number
  returnSpd: number
  ambientMotion: boolean

  constructor(
    x: number,
    y: number,
    size: number,
    color: string,
    dispersion: number,
    returnSpd: number,
    ambientMotion: boolean,
  ) {
    this.x = ambientMotion ? x + (Math.random() - 0.5) * 10 : x
    this.y = ambientMotion ? y + (Math.random() - 0.5) * 10 : y
    this.originX = x
    this.originY = y
    this.vx = ambientMotion ? (Math.random() - 0.5) * 5 : 0
    this.vy = ambientMotion ? (Math.random() - 0.5) * 5 : 0
    this.size = size
    this.color = color
    this.dispersion = dispersion
    this.returnSpd = returnSpd
    this.ambientMotion = ambientMotion
  }

  update(mouseX: number, mouseY: number, interactive: boolean) {
    const dx = mouseX - this.x
    const dy = mouseY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const interactionRadius = 120

    if (
      interactive &&
      distance > 0 &&
      distance < interactionRadius &&
      mouseX !== -1000 &&
      mouseY !== -1000
    ) {
      const forceDirectionX = dx / distance
      const forceDirectionY = dy / distance
      const force = (interactionRadius - distance) / interactionRadius

      this.vx -= forceDirectionX * force * this.dispersion
      this.vy -= forceDirectionY * force * this.dispersion
    }

    this.vx += (this.originX - this.x) * this.returnSpd
    this.vy += (this.originY - this.y) * this.returnSpd

    this.vx *= 0.85
    this.vy *= 0.85

    const distToOrigin = Math.sqrt(
      Math.pow(this.x - this.originX, 2) + Math.pow(this.y - this.originY, 2),
    )

    if (this.ambientMotion && distToOrigin < 1 && Math.random() > 0.95) {
      this.vx += (Math.random() - 0.5) * 0.2
      this.vy += (Math.random() - 0.5) * 0.2
    }

    this.x += this.vx
    this.y += this.vy
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 2.5,
    )
    gradient.addColorStop(0, this.color)
    gradient.addColorStop(0.4, this.color)
    gradient.addColorStop(1, "rgba(0,0,0,0)")

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function CursorDrivenParticleTypography({
  className,
  text,
  fontSize = 120,
  fontFamily = "Inter, sans-serif",
  particleSize = 1.5,
  particleDensity = 6,
  dispersionStrength = 15,
  returnSpeed = 0.08,
  color,
  interactive = true,
  ambientMotion = true,
}: CursorDrivenParticleTypographyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    let mouseX = -1000
    let mouseY = -1000
    let containerWidth = 0
    let containerHeight = 0

    const init = () => {
      const container = containerRef.current
      if (!container) return

      containerWidth = container.clientWidth
      containerHeight = container.clientHeight

      const dpr = window.devicePixelRatio || 1
      canvas.width = containerWidth * dpr
      canvas.height = containerHeight * dpr
      canvas.style.width = `${containerWidth}px`
      canvas.style.height = `${containerHeight}px`

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      const computedStyle = window.getComputedStyle(container)
      const textColor = color || computedStyle.color || "#000000"

      ctx.clearRect(0, 0, containerWidth, containerHeight)

      const effectiveFontSize = Math.min(fontSize, containerWidth * 0.32)
      ctx.fillStyle = textColor
      ctx.font = `bold ${effectiveFontSize}px ${fontFamily}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(text, containerWidth / 2, containerHeight / 2)

      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height)
      particles = []

      const step = Math.max(1, Math.floor(particleDensity * dpr))

      for (let y = 0; y < textCoordinates.height; y += step) {
        for (let x = 0; x < textCoordinates.width; x += step) {
          const index = (y * textCoordinates.width + x) * 4
          const alpha = textCoordinates.data[index + 3] || 0

          if (alpha > 128) {
            particles.push(
              new Particle(
                x / dpr,
                y / dpr,
                particleSize,
                textColor,
                dispersionStrength,
                returnSpeed,
                ambientMotion,
              ),
            )
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      particles.forEach((particle) => {
        particle.update(mouseX, mouseY, interactive)
        particle.draw(ctx)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = e.clientX - rect.left
      mouseY = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouseX = -1000
      mouseY = -1000
    }

    const timeoutId = setTimeout(() => {
      init()
      animate()
    }, 100)

    const resizeObserver = new ResizeObserver(init)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [
    text,
    fontSize,
    fontFamily,
    particleSize,
    particleDensity,
    dispersionStrength,
    returnSpeed,
    color,
    interactive,
    ambientMotion,
  ])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full touch-none items-center justify-center",
        className,
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
