import { useState, useEffect, useRef, useCallback } from 'react'
import { Pen, CircleDot, Moon, Sun, ZoomIn, ZoomOut, GripVertical, Hand} from 'lucide-react'
import './App.css'

// OK VS CODE I WILL USE THE IMPORTS
//  BE PATIENT
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
// i only chose react since its a modern framework. i actually hate coding react
// its like using javascript, but none of the fun html... at least the css is there, and css is so easy
//sorry for the yap



function App() {
  const [viewState, setViewState] = useState({ zoom: 1, pan: { x: 0, y: 0 } })
  const [ isDark, setIsDark] =  useState(prefersDark)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  const [sidebarPosition, setSidebarPosition] = useState(() => ({
    x: 20,
    y: window.innerHeight / 2,
  }))

  const [zoomPosition, setZoomPosition] = useState(() => ({
    x: window.innerWidth / 2 - 160,
    y: window.innerHeight - 80,
  } ))

  const [isPanMode, setIsPanMode] = useState(false)

  const dragInfoRef = useRef<{
    target: 'sidebar' | 'zoom' | null
    offsetX: number
    offsetY: number
  }>({
    target: null,
    offsetX: 0,
    offsetY: 0,
  })

  const panInfoRef = useRef<{
    isPanning: boolean
    startX: number
    startY: number
    startPanX: number
    startPanY: number
  }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  })

  const MIN_SCALE = 0.0001
  const MAX_SCALE = 10000


  const handleDragMove = useCallback((event: MouseEvent) => {
    const dragInfo = dragInfoRef.current
    if (!dragInfo.target) return


    const viewportWidth =window.innerWidth
    const viewportHeight  = window.innerHeight

    const x = Math.min (
      viewportWidth - 40,
      Math.max(20, event.clientX - dragInfo.offsetX)
    )
    const y = Math.min  (
      viewportHeight -40,
      Math.max(20, event.clientY -  dragInfo.offsetY ) //why is math capital
    )

    if (dragInfo.target === 'sidebar') {
      setSidebarPosition({x,y}
      )

    } else if (dragInfo.target === 'zoom') {
      setZoomPosition({x,y})
    }
  }, [])

  const handleDragEnd= useCallback(() => 
    {
      dragInfoRef.current= {
        ...dragInfoRef.current,
        target: null,
    }


    window.removeEventListener('mousemove', handleDragMove)
    window.removeEventListener('mouseup', handleDragEnd)
  }, [handleDragMove])


  const  startDrag = useCallback (
    (event: any, target: 'sidebar'|'zoom')=>  {
      event.preventDefault()
      const currentPos = target === 'sidebar' ? sidebarPosition :zoomPosition

      dragInfoRef.current = {
        target,
        offsetX: event.clientX - currentPos.x,
        offsetY: event.clientY - currentPos.y,
      }

      window.addEventListener('mousemove',handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
    },
    [sidebarPosition, zoomPosition, handleDragMove, handleDragEnd]
  )

  const handlePanMove = useCallback((event: MouseEvent) => {
    const panInfo = panInfoRef.current
    if (!panInfo.isPanning) return

    const dx = event.clientX - panInfo.startX
    const dy = event.clientY - panInfo.startY

    setViewState((prev) => ({
      ...prev,
      pan: {
        x: panInfo.startPanX + dx,
        y: panInfo.startPanY + dy,
      },
    }))
  }, [])

  const handlePanEnd = useCallback(() => {
    panInfoRef.current = {
      ...panInfoRef.current,
      isPanning: false,
    }

    window.removeEventListener('mousemove',handlePanMove)
    window.removeEventListener('mouseup', handlePanEnd)
  }, [handlePanMove])

  const handleCanvasMouseDown =  (event:any) => {
    if (!isPanMode) return

    event.preventDefault()

    panInfoRef.current = {
      isPanning: true,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: viewState.pan.x,
      startPanY: viewState.pan.y,
    }

    window.addEventListener('mousemove' , handlePanMove)
    window.addEventListener('mouseup' , handlePanEnd)
  }


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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key==='Escape') {
          setIsPanMode(false)

          if (panInfoRef.current.isPanning) {
            panInfoRef.current = {
              ...panInfoRef.current,
              isPanning: false,
            }


            window.removeEventListener('mousemove', handlePanMove)
            window.removeEventListener('mouseup', handlePanEnd)
          }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown' , handleKeyDown)
    }
  }, [handlePanMove, handlePanEnd])

  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()

      const container = mainContainerRef.current
      if (!container) return


     // const rect = container.getBoundingClientRect()
     // const pivotX = e.clientX - rect.left
     // const pivotY = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        //const unitFactor = e.deltaMode === 1 ? 0.05 : 0.001
        //const scaleFactor = Math.exp(-e.deltaY * unitFactor)
        //zoomAtPivot({ x: pivotX, y: pivotY }, scaleFactor)
      //} else {

        return
      }
        setViewState((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x - e.deltaX,
            y: prev.pan.y - e.deltaY,
          },
        }))
      }

    const container = mainContainerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelEvent, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheelEvent)
    }
  }, [])

  const handleZoomChange = (factor: number) => {
    const container = mainContainerRef.current
    const centerPoint = container
      ? { x: container.clientWidth / 2, y: container.clientHeight / 2 }
      : { x: 0, y: 0 }
    

    const steps = 12
    const stepFactor = Math.pow(factor, 1 / steps)
    let currentStep = 0

    const step = () => {
      currentStep += 1
      zoomAtPivot(centerPoint, stepFactor)
      if (currentStep < steps) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
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

  const BASE_GRID_PX = 20
  const BASE_SCALE = 1

  const [isEditingScale, setIsEditingScale] = useState(false)
  const [scaleDraft, setScaleDraft] = useState('')

  const scaleValue = viewState.zoom * BASE_SCALE
  const gridSpacingPx = BASE_GRID_PX * viewState.zoom

  const handleScaleLabelClick = () => {
    setIsEditingScale(true)
    setScaleDraft(scaleValue.toFixed(2))
  }

  const applyScaleDraft = () => {
    const value = parseFloat(scaleDraft)

    if (Number.isNaN(value)) {
      setIsEditingScale(false)
      return
    }

    const minScale = MIN_SCALE * BASE_SCALE
    const maxScale = MAX_SCALE * BASE_SCALE
    const clampedScale = Math.min(maxScale, Math.max(minScale, value))
    const newZoom = clampedScale / BASE_SCALE

    setViewState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_SCALE, Math.min(MAX_SCALE, newZoom)),
    }))
    setIsEditingScale(false)
  }

  const handleScaleDraftChange = (event: any) => {
    setScaleDraft(event.target.value)
  }

  const handleScaleInputBlur = () => {
    applyScaleDraft()
  }

  const handleScaleInputKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      applyScaleDraft()
    } else if (event.key === 'Escape') {
      setIsEditingScale(false)
    }
  }

  return (
    <div
      className={`app-container ${isPanMode ? 'pan-mode' : ''}`}
      ref={mainContainerRef}
    >
      <div
        className="dotted-background"
        style={{
          backgroundSize: `${gridSpacingPx}px ${gridSpacingPx}px`,
          backgroundPosition: `${viewState.pan.x}px ${viewState.pan.y}px`,
        }}
        onMouseDown = {handleCanvasMouseDown}
      ></div>

      <div
        className="sidebar"
        style={{ left: sidebarPosition.x, top: sidebarPosition.y }}
      >
        <button className="sidebar-button" onClick={() => {}}>
          <Pen size={24} />
        </button>
        <button
          className={`sidebar-button sidebar-button-${isPanMode ? 'active' : ''}`}
          onClick={() => setIsPanMode((prev) => !prev)}
        >
          <Hand size={22} />
        </button>
        <button className="sidebar-button" onClick={() => {}}>
          <CircleDot size={20} />
        </button>
        <button className="sidebar-button" onClick={toggleTheme}>
          {isDark ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        <div
          className="pill-drag-handle pill-drag-handle-vertical"
          onMouseDown={(event) => startDrag(event, 'sidebar')}
        >
          <GripVertical size={16} />
        </div>
      </div>

      <div
        className="zoom-controls sidebar"
        style={{
          left: zoomPosition.x,
          top: zoomPosition.y,
          backgroundColor: isDark ? '#000000' : '#ffffff',
        }}
      >
        <div className="zoom-controls-bg" aria-hidden="true" />
        <div
          className="pill-drag-handle pill-drag-handle-horizontal"
          onMouseDown={(event) => startDrag(event, 'zoom')}
        >
          <GripVertical size={16} className="pill-drag-icon-horizontal" />
        </div>
        <span
          className="zoom-distance-label"
          onClick={handleScaleLabelClick}
        >
          {isEditingScale ? (
            <input
              className="zoom-scale-input"
              value={scaleDraft}
              onChange={handleScaleDraftChange}
              onBlur={handleScaleInputBlur}
              onKeyDown={handleScaleInputKeyDown}
              autoFocus
            />
          ) : (
            <>Scale: 1cm = {scaleValue.toFixed(2)}</>
          )}
        </span>


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

//who decided the syntax for this