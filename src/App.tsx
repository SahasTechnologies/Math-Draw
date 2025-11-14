import { useState, useEffect, useRef, useCallback } from 'react'
import { Pen, CircleDot, Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react'
import './App.css'
// OK VS CODE I WILL USE THE IMPORTS
//  BE PATIENT
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
// i only chose react since its a modern framework
// i actually hate coding react
// its like using javascript, but none of the fun html
// at least the css is there, and css is so easy
function App() {
  const [viewState, setViewState] = useState({ zoom: 1, pan: { x: 0, y: 0 } })
  const [ isDark, setIsDark] =  useState(prefersDark)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  const MIN_SCALE = 0.1
  const MAX_SCALE = 10

  const  zoomAtPivot = useCallback(
    (center: { x: number; y: number }, factor: number) => {
      setViewState((prevState) => {
        let nextZoom = prevState.zoom * factor
        nextZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextZoom))

        const baseZoom = prevState.zoom || 1
        const zoomRatio = nextZoom / baseZoom



        return {
          zoom: nextZoom,
          pan: {
            x: center.x - zoomRatio * (center.x - prevState.pan.x),
            y: center.y - zoomRatio * (center.y - prevState.pan.y),
          },
        }
      })
    },
    [MIN_SCALE, MAX_SCALE]
  )

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()

      const container = mainContainerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const pivotX = e.clientX - rect.left
      const pivotY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
         //FIXME
        const unitFactor = e.deltaMode === 1 ? 0.05 : 0.001
        const scaleFactor = Math.exp(-e.deltaY * unitFactor)
        zoomAtPivot({ x: pivotX, y: pivotY }, scaleFactor)
      } else {
        setViewState((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x - e.deltaX,
            y: prev.pan.y - e.deltaY,
          },
        }))
      }
    }

    const container =  mainContainerRef.current
    if (container) {

      container.addEventListener('wheel', handleWheelEvent, { passive: false } 

      )
      return () => container.removeEventListener('wheel', handleWheelEvent)
    }
  }, [zoomAtPivot])

  const handleZoomChange = (factor: number) => {
    const container = mainContainerRef.current
    const centerPoint = container
      ? { x: container.clientWidth / 2, y: container.clientHeight / 2 }
      : { x: 0, y: 0 }
    zoomAtPivot(centerPoint, factor)
  }

  const handleZoomIn = () => {
    handleZoomChange(1.2)
  }
  const handleZoomOut = () => {
    handleZoomChange(1 / 1.2)
  }

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  return ( 
    <div className="app-container" ref={mainContainerRef}>
      <div
        className="dotted-background"
        style={{
          backgroundSize: `${20 * viewState.zoom}px ${20 * viewState.zoom}px`,
          backgroundPosition: `${viewState.pan.x}px ${viewState.pan.y}px`,
        }}
      ></div>

      <div className="sidebar">
        <button className="sidebar-button" onClick={() => {}}>
          <Pen size={24} />
        </button>
        <button className="sidebar-button" onClick={() => {}}>
          <CircleDot size={20} />
        </button>
        <button className="sidebar-button" onClick={toggleTheme}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div className="zoom-controls">
        <button className="zoom-button" onClick={handleZoomIn}>
          <ZoomIn size={20} />
        </button>
        <button className="zoom-button" onClick={handleZoomOut}>
          <ZoomOut size={20} />
        </button>
      </div>

      <div className="canvas-area"></div>
    </div>
  )
}

export default App

