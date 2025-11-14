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

interface Capture {
  id?: number
  latitude?: number
  longitude?: number
  lat?: number
  lon?: number
  gps_latitude?: number
  gps_longitude?: number
  [key: string]: any
}

interface GridCell {
  lat: number | null
  lon: number | null
  captureId: number | null
}

interface CaptureDetail {
  id: number
  user_id: string
  image: string
  latitude: number
  longitude: number
  created_at: string
}

const App = () => {
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ x: 0, y: 0 })
  const [trail, setTrail] = useState<CursorPosition[]>([])
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loadingImage, setLoadingImage] = useState<boolean>(false)
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

  // Fetch captures data from API
  // Note: /api/* is proxied to https://thunder.dwani.ai/* via Vite config
  useEffect(() => {
    const fetchCaptures = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          '/api/v1/user-captures/time-range/?start_time=2025-11-14T00%3A00%3A00&end_time=2025-11-14T23%3A59%3A59&skip=0&limit=100',
          {
            method: 'GET',
            headers: {
              'accept': 'application/json'
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        // Handle both array and object with items property
        const capturesArray = Array.isArray(data) ? data : (data.items || data.results || [])
        setCaptures(capturesArray)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch captures')
        console.error('Error fetching captures:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCaptures()
  }, [])

  // Extract GPS coordinates from captures and populate 10x10 grid
  const gridCoordinates = useMemo(() => {
    const grid: Array<Array<GridCell>> = []
    
    // Initialize empty grid
    for (let row = 0; row < 10; row++) {
      const rowData: GridCell[] = []
      for (let col = 0; col < 10; col++) {
        rowData.push({ lat: null, lon: null, captureId: null })
      }
      grid.push(rowData)
    }

    // Populate grid with capture data (up to 100 captures)
    captures.slice(0, 100).forEach((capture, index) => {
      const row = Math.floor(index / 10)
      const col = index % 10
      
      if (row < 10 && col < 10) {
        // Try different possible field names for coordinates (including nested)
        const lat = 
          capture.latitude ?? 
          capture.lat ?? 
          capture.gps_latitude ?? 
          capture.location?.latitude ??
          capture.location?.lat ??
          capture.gps?.latitude ??
          capture.gps?.lat ??
          null
        
        const lon = 
          capture.longitude ?? 
          capture.lon ?? 
          capture.gps_longitude ?? 
          capture.location?.longitude ??
          capture.location?.lon ??
          capture.gps?.longitude ??
          capture.gps?.lon ??
          null
        
        // Get capture ID
        const captureId = capture.id ?? null
        
        // Only set if both coordinates are valid numbers
        if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
          grid[row][col] = { lat, lon, captureId }
        }
      }
    })

    return grid
  }, [captures])

  // Handle grid cell click to fetch and display image
  const handleCellClick = async (captureId: number | null) => {
    if (!captureId) return

    try {
      setLoadingImage(true)
      const response = await fetch(`/api/v1/user-captures/${captureId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: CaptureDetail = await response.json()
      
      // Decode base64 image
      if (data.image) {
        setSelectedImage(`data:image/png;base64,${data.image}`)
      }
    } catch (err) {
      console.error('Error fetching capture detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch image')
    } finally {
      setLoadingImage(false)
    }
  }

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
            {loading ? (
              <div className="grid-loading">Loading GPS coordinates...</div>
            ) : error ? (
              <div className="grid-error">Error: {error}</div>
            ) : (
              <div className="map-grid">
                {gridCoordinates.map((row, rowIndex) => (
                  <div key={rowIndex} className="map-grid-row">
                    {row.map((coord, colIndex) => (
                      <div 
                        key={colIndex} 
                        className={`map-grid-cell ${coord.captureId ? 'clickable' : ''}`}
                        onClick={() => coord.captureId && handleCellClick(coord.captureId)}
                        style={{ cursor: coord.captureId ? 'pointer' : 'default' }}
                      >
                        {coord.lat !== null && coord.lon !== null ? (
                          <>
                            <div className="grid-coord-lat">
                              {coord.lat.toFixed(6)}° {coord.lat >= 0 ? 'N' : 'S'}
                            </div>
                            <div className="grid-coord-lon">
                              {Math.abs(coord.lon).toFixed(6)}° {coord.lon >= 0 ? 'E' : 'W'}
                            </div>
                          </>
                        ) : (
                          <div className="grid-coord-empty">--</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
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
                  {loadingImage ? (
                    <div className="weapon-loading">Loading...</div>
                  ) : selectedImage ? (
                    <img 
                      src={selectedImage} 
                      alt="Capture" 
                      className="weapon-image"
                    />
                  ) : (
                    <>
                      <span className="weapon-number">1.</span> WEAPON NAME
                    </>
                  )}
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

