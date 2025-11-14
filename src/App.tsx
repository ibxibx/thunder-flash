import { useState, useEffect, useRef, useMemo } from 'react'
import './App.css'

interface Message {
  id: number
  sender: string
  content: string
}

interface CursorPosition {
  x: number
  y: number
}

const App = () => {
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ x: 0, y: 0 })
  const [trail, setTrail] = useState<CursorPosition[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const messages: Message[] = [
    {
      id: 1,
      sender: 'Adam SMITH',
      content: 'Message from Adam Smith template Message te Template Message Template mpla Message'
    },
    {
      id: 2,
      sender: 'Ben PETERS',
      content: 'Message from Ben Peters template Message temp Template Message Template'
    },
    {
      id: 3,
      sender: 'SAM MENDES',
      content: 'Message from Sam Mendes Message templa Template Message Template Messa Template Message Template Message Template Message Template Message Template'
    }
  ]

  // Generate GPS coordinates for a 10x10 grid
  const gridCoordinates = useMemo(() => {
    const grid: Array<Array<{ lat: number; lon: number }>> = []
    const baseLat = 32.56249932 // Base latitude
    const baseLon = -32.56249932 // Base longitude
    const step = 0.001 // Step size for grid cells

    for (let row = 0; row < 10; row++) {
      const rowData: Array<{ lat: number; lon: number }> = []
      for (let col = 0; col < 10; col++) {
        rowData.push({
          lat: baseLat + (9 - row) * step, // Reverse row order so top is higher latitude
          lon: baseLon + col * step
        })
      }
      grid.push(rowData)
    }
    return grid
  }, [])

  useEffect(() => {
    let animationFrame: number

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        cancelAnimationFrame(animationFrame)
        animationFrame = requestAnimationFrame(() => {
          setCursorPos({ x, y })

          // Add to trail for glow effect
          setTrail(prev => {
            const newTrail = [...prev, { x, y }]
            return newTrail.slice(-8) // Keep last 8 positions for trail
          })
        })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div className="app-container" ref={containerRef}>
      {/* Animated Cursor */}
      <div
        className="cursor"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
        }}
      />
      {trail.map((pos, index) => (
        <div
          key={index}
          className="cursor-trail"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            opacity: (index + 1) / trail.length * 0.3,
          }}
        />
      ))}

      {/* Main Layout */}
      <div className="main-layout">
        {/* Map View Section */}
        <div className="map-view-container">
          <div className="map-view-border">
            <div className="map-grid">
              {gridCoordinates.map((row, rowIndex) => (
                <div key={rowIndex} className="map-grid-row">
                  {row.map((coord, colIndex) => (
                    <div key={colIndex} className="map-grid-cell">
                      <div className="grid-coord-lat">
                        {coord.lat.toFixed(6)}° N
                      </div>
                      <div className="grid-coord-lon">
                        {Math.abs(coord.lon).toFixed(6)}° W
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Map View Label and Coordinates */}
          <div className="map-view-header">
            <div className="map-view-label">
              MAP VIEW
            </div>
            <div className="coordinates">
              COORDINATES: 3256.249932° N<br />
              3256.249932° W
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          {/* Weapon Selection Grid */}
          <div className="weapon-grid-container">
            <div className="weapon-grid-border">
              <div className="weapon-grid">
                <div className="weapon-slot">
                  <span className="weapon-number">1.</span> WEAPON NAME
                </div>
                <div className="weapon-slot">
                  <span className="weapon-number">2.</span> WEAPON NAME
                </div>
                <div className="weapon-slot">
                  <span className="weapon-number">3.</span> WEAPON NAME
                </div>
                <div className="weapon-slot">
                  <span className="weapon-number">4.</span> WEAPON NAME
                </div>
              </div>
            </div>
            
            {/* Message Log */}
            <div className="message-log-container">
              <div className="message-log-border">
                <div className="message-log">
                  {messages.map((message) => (
                    <div key={message.id} className="message-item">
                      <span className="message-sender">{message.sender}:</span>
                      <span className="message-content"> {message.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

