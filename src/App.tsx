import { useState, useEffect, useRef, useCallback } from 'react'
import { Pen, CircleDot, Moon, Sun, ZoomIn, ZoomOut, GripVertical, Hand, Circle, Square, Triangle, Trash2} from 'lucide-react'
import './App.css'

// OK VS CODE I WILL USE THE IMPORTS
//  BE PATIENT
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
// i only chose react since its a modern framework. i actually hate coding react
// its like using javascript, but none of the fun html... at least the css is there, and css is so easy
//sorry for the yap



function getPointName(index: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const length = alphabet.length
  let name = ''
  let n = index
  do {
    const remainder = n % length
    name = alphabet[remainder] + name
    n = Math.floor(n / length) - 1
  } while (n >= 0)
  return name
}

type PointShape = 'circle'|'square'|'triangle'

type Point={
  id: number
  name: string
  x: number
  y: number
  color: string
  shape: PointShape //this feels exactly like css
}

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
  const [activeTool, setActiveTool] = useState<string | null>(null)

  const [activePointMenuId, setActivePointMenuId] = useState<number | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const viewStateRef=useRef(false)
  const pointDragMovedRef=useRef(false)

  const dragInfoRef = useRef<{
    target: 'sidebar' | 'zoom' | 'point' | null
    pointId: number | null
    offsetX: number
    offsetY: number
    startX: number
    startY: number
  }>({
    target: null,
    pointId: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
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

  useEffect(() => {
    viewStateRef.current = viewState
  }, [viewState])

  const MIN_SCALE = 0.0001
  const MAX_SCALE = 10000


  const handleDragMove = useCallback((event: MouseEvent) => {
    const dragInfo = dragInfoRef.current
    if (!dragInfo.target) return

    const rawX = event.clientX - dragInfo.offsetX
    const rawY = event.clientY - dragInfo.offsetY

    if (dragInfo.target === 'sidebar' || dragInfo.target === 'zoom') {
      const viewportWidth = window.innerWidth
      const viewportHeight  = window.innerHeight

      const x = Math.min (
       viewportWidth - 40,
        Math.max(20, rawX)
    )
    const y = Math.min(
        viewportHeight - 40,
        Math.max(20, rawY) //why is math capital
    )

      if (dragInfo.target === 'sidebar') {
        setSidebarPosition({ x, y })
      } else if (dragInfo.target === 'zoom') {
        setZoomPosition({ x, y })
      }
    } else if (dragInfo.target === 'point' && dragInfo.pointId != null) {
      const dxFromStart = event.clientX - dragInfo.startX
      const dyFromStart = event.clientY -  dragInfo.startY
      const movedDistanceSq = dxFromStart *  dxFromStart + dyFromStart * dyFromStart
      if (movedDistanceSq > 25) {
        pointDragMovedRef.current = true
      }

      const container = mainContainerRef.current

      if (!container) return

      const  rect = container.getBoundingClientRect()
      const localX = rawX - rect.left
        const localY = rawY - rect.top

      const currentViewState = viewStateRef.current      
      const gridSpacing = 20 *currentViewState.zoom


      const worldX = Math.round((localX -   currentViewState.pan.x) / gridSpacing)
      const worldY = Math.round((localY - currentViewState.pan.y) / gridSpacing)

      setPoints((prevPoints) =>
        prevPoints.map((point) =>
          point.id === dragInfo.pointId
            ? { ...point, x: worldX, y: worldY }
            : point
        )
      )
    }
      }
  }, [])

  const handleDragEnd= useCallback(() => 
    {
      dragInfoRef.current= {
        ...dragInfoRef.current,
        target: null,
        pointId: null,
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
        pointId: null,
        offsetX: event.clientX - currentPos.x,
        offsetY: event.clientY - currentPos.y,
      }

      window.addEventListener('mousemove',handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
    },
    [sidebarPosition, zoomPosition, handleDragMove, handleDragEnd]
  )

  
  const startPointDrag = useCallback(
    (event: any, pointId: number, screenX: number, screenY: number) => {
      event.preventDefault()

      pointDragMovedRef.current = false

      dragInfoRef.current = {
        target: 'point',
        pointId,
        offsetX: event.clientX - screenX,
        offsetY: event.clientY - screenY,
        startX: event.clientX,
        startY: event.clientY,
      }

      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
    },
    [handleDragMove, handleDragEnd]
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
    const container = mainContainerRef.current
    if (!container) return


    setActivePointMenuId (null)


    if (isPanMode) {
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

      return
    }

    if (activeTool === 'point') {
      const rect = container.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top

      const gridSpacing = 20 * viewState.zoom

      const worldX = Math.round((localX - viewState.pan.x) / gridSpacing)
      const worldY = Math.round((localY - viewState.pan.y) / gridSpacing)

      setPoints((prevPoints) => {
        const index = prevPoints.length
        const name = getPointName(index)
        return [
          ...prevPoints,
          { id: index, name, x: worldX, y: worldY, color: 'ff3366', shape: 'circle' },
        ]
      })
    }
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

  const handlePanButtonClick = () => {
    setIsPanMode((prev) => {
      const next = !prev
      if (next) {
        setActiveTool(null)
      }
      return next
    })
  }

  const handlePointClick = (pointId: number) => {
    if (pointDragMovedRef.current) {
      pointDragMovedRef.current = false
      return
    }


    setActivePointMenuId((prev) =>  (prev ===  pointId ? null: pointId ))

  }

  const handlePointColorChange = (pointId:number, color: string) => {
    setPoints((prevPoints) =>
      prevPoints.map((point) =>
        point.id === pointId ? {...point, color} : point
  ))}


  const handlePointDelete  = (pointId: number) => {
    setPoints( (prevPoints) =>
        prevPoints.map ((point) => {
          if (point.id !== pointId) return point
          const nextShape: PointShape = 
            point.shape === 'circle'
              ? 'square'
              : point.shape === 'square'
              ? 'triangle'
              : 'circle'
          return {  ...point, shape: nextShape}
        }))
  }

  const handlePointToolClick = () => {
    setActiveTool((prev) => {
      const next = prev === 'point' ? null : 'point'
      if (next) {
        setIsPanMode(false)
      }
      return next
    })
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
          onClick={handlePanButtonClick}
        >
          <Hand size={22} />
        </button>
        <button
          className={`sidebar-button sidebar-button-${activeTool === 'point' ? 'active' : ''}`}
          onClick={handlePointToolClick}
        >
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


        {points.map((point) => {
          const spacing = gridSpacingPx
          const screenX = viewState.pan.x + point.x * spacing
          const screenY = viewState.pan.y + point.y * spacing
          const isMenuOpen = activePointMenuId === point.id

          return (
            <div
              key={point.id}
              className="point-marker"
              style={{
                left: screenX,
                top: screenY,
              }}
            >
            {isMenuOpen && (
              <div className="point-menu">
                <div
                  className="point-menu-color"
                  style={{ backgroundColor: point.color }}
                >
                  <input
                    type="color"
                    className="point-menu-color-input"
                    value={point.color}
                    onChange={(event) =>
                      handlePointColorChange(point.id, event.target.value)
                    }
                  />
                </div>
                <button
                  className="point-menu-button"
                  onClick={() => handlePointShapeToggle(point.id)}
                >
                  {point.shape === 'circle' && <Circle size={14} />}
                  {point.shape === 'square' && <Square size={14} />}
                  {point.shape === 'triangle' && <Triangle size={14} />}
                </button>
                <button
                  className="point-menu-button"
                  onClick={() => handlePointDelete(point.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            <div
              className={`point-dot ${
                point.shape === 'square'
                  ? 'point-dot-square'
                  : point.shape === 'triangle'
                  ? 'point-dot-triangle'
                  : ''
              }`}
              style={
                point.shape === 'triangle'
                  ? { borderBottomColor: point.color }
                  : { backgroundColor: point.color }
              }
              onMouseDown={(event) =>
                startPointDrag(event, point.id, screenX, screenY)
              }
              onClick={() => handlePointClick(point.id)}
            />
              <div className="point-label">{point.name}</div>
            </div>
          )
        })}
      </div>
  )
}

export default App
//who decided the syntax for this