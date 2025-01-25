/**
 * I've disabled the following:
 * 1. Zoom out when accessory is unclicked (can be enabled with flag).
 * 2. Remove zoom when you go into history. (causes issues with rendering)
 * I use something like euclidean to find the largest cluster.
 */

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import MapControls from './MapControls'
import { Socket } from 'socket.io-client'

interface Location {
  lat: number
  lng: number
}

interface LocationAndStatus {
  id: string
  location: Location | null
  status: string
  timestamp: string
}

interface AccessoryColorAndIcon {
  id: string
  color: string
  icon: string
}

interface MapProps {
  selectedDays: number
  isButtonClicked: boolean
  selectedAccessoryId: string | null
  isSatellite: boolean
  socket: Socket | null
  accessoryColorAndIcon: AccessoryColorAndIcon[]
  setLocationAndStatus: React.Dispatch<
    React.SetStateAction<LocationAndStatus[] | null>
  >
}

interface GeoData {
  device_id?: string
  accessory_id?: string
  latitude: number
  longitude: number
  elevation?: number
  timestamp?: string
  status?: string
}

type Position = {
  id: string
  lat: number
  lng: number
}

const libraries: ('places' | 'geometry')[] = ['places', 'geometry']

const Map = ({
  selectedAccessoryId,
  selectedDays,
  isButtonClicked,
  isSatellite,
  socket,
  accessoryColorAndIcon,
  setLocationAndStatus,
}: MapProps) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  })

  /** The level of zoom when you click on accessory. */
  const ZOOM_LEVEL_ICON: number = 20

  /** Automatically zoom out when you click out of the accessory. */
  const ZOOM_OUT_ICON: boolean = false

  // The Google Map instance.
  const [map, setMap] = useState<google.maps.Map | null>(null)

  // A reference to the Google Map container element.
  const mapRef = useRef<HTMLDivElement>(null)

  // References to the currently displayed default markers on the map.
  const markerRefs = useRef<google.maps.Marker[]>([])

  // References to the currently displayed custom markers on the map.
  const customMarkerElementsRef = useRef<HTMLDivElement[]>([])

  // An array of positions (latitude and longitude) for markers on the map.
  const [positions, setPositions] = useState<Position[]>([])

  // A flag to trigger a refresh of all accessories on the map.
  const [refreshMap, setRefreshMap] = useState(false)

  // A flag to indicate if the map should revert to its original location and zoom.
  const [setDefault, shouldSetDefault] = useState(false)

  // A flag to indicate if the map has been fully loaded.
  const [initialLoad, setInitialLoad] = useState(false)

  // A flag to control the zoom level into an accessory.
  const [renderZoom, setRenderZoom] = useState(false)

  // The currently selected number of days based on the selectedDays prop.
  const [currentSelectedDays, setSelectedDays] = useState(selectedDays)

  // The ID of the previously selected accessory.
  let [previousSelectedID, setPreviousSelectedID] = useState<string | null>(
    null,
  )

  /**
   * Update the markers.
   * Issue with placement for custom markers:
   * https://github.com/google-map-react/google-map-react/issues/854
   *
   * @param {Position[]} positions - A list of positions to where to put the markets.
   */
  const updateMarkers = (positions: Position[]) => {
    // Clear existing markers
    markerRefs.current.forEach(marker => marker.setMap(null))
    markerRefs.current = []
    customMarkerElementsRef.current.forEach(markerElement =>
      markerElement.remove(),
    )
    customMarkerElementsRef.current = []

    // Checking to see if HistoricalDataSlider is active.
    const useDefaultMarkers = currentSelectedDays >= 1

    // Add new markers
    positions.forEach(position => {
      // Default markers.
      if (
        useDefaultMarkers &&
        isButtonClicked &&
        selectedAccessoryId !== null
      ) {
        const marker = new google.maps.Marker({
          position,
          map,
        })
        markerRefs.current.push(marker)
      } else {
        // Custom markers.
        const foundAccessory = accessoryColorAndIcon.find(
          acc => acc.id === position.id,
        )

        if (currentSelectedDays !== 0) {
          setSelectedDays(0)
        }

        if (foundAccessory && currentSelectedDays === 0) {
          const { color, icon } = foundAccessory

          // Create a custom marker with the specified color and icon
          const marker = new google.maps.Marker({
            position,
            map,
            icon: {
              url: '/blank.png', // A transparent image.
              scaledSize: new google.maps.Size(1, 1),
            },
          })
          markerRefs.current.push(marker)

          // Set the custom icon based on the same CSS used for the accessory icon.
          const markerElement = document.createElement('div')
          markerElement.style.position = 'absolute'
          markerElement.style.transform = 'translate(-50%, -50%)'
          markerElement.className =
            'marker border-3 bg-eaeaea border-solid w-9 h-9 rounded-full flex items-center justify-center'
          markerElement.style.borderColor = color

          const svgElement = document.createElement('div')
          svgElement.innerHTML = icon
          svgElement.style.display = 'block'
          svgElement.style.margin = 'auto'
          markerElement.appendChild(svgElement)

          // Add the marker element to the map
          const markerOverlay = new google.maps.OverlayView()
          markerOverlay.draw = () => {
            const projection = markerOverlay.getProjection()
            if (projection) {
              const point = projection.fromLatLngToDivPixel(
                marker.getPosition() as google.maps.LatLng,
              )
              if (point) {
                const offsetX = -markerElement.offsetWidth / 2
                const offsetY = -markerElement.offsetHeight / 2
                markerElement.style.left = point.x + offsetX + 'px'
                markerElement.style.top = point.y + offsetY + 'px'
              }
            }
          }
          markerOverlay.setMap(map)
          markerOverlay
            .getPanes()
            ?.overlayMouseTarget.appendChild(markerElement)
          customMarkerElementsRef.current.push(markerElement)
        }
      }
    })
  }

  /**
   * Update the markers.
   */
  useLayoutEffect(() => {
    if (positions.length > 0 && map && refreshMap) {
      updateMarkers(positions)
    }
  }, [positions, map, accessoryColorAndIcon, refreshMap])

  /**
   * Zoom into accessory when it's clicked.
   */
  useEffect(() => {
    if (previousSelectedID !== selectedAccessoryId && selectedAccessoryId) {
      setRenderZoom(false)
    }

    if (positions.length > 0 && map && selectedAccessoryId && !renderZoom) {
      updateMarkers(positions)
      const bounds = new google.maps.LatLngBounds()

      if (selectedAccessoryId) {
        // If an accessory is selected, find its position and extend bounds
        const selectedPosition = positions.find(
          position => position.id === selectedAccessoryId,
        )

        if (selectedPosition && !isButtonClicked) {
          bounds.extend(
            new google.maps.LatLng(selectedPosition.lat, selectedPosition.lng),
          )
          map.fitBounds(bounds)
          map.setZoom(ZOOM_LEVEL_ICON)
        }
        setPreviousSelectedID(selectedAccessoryId)
      }
      setRenderZoom(true)
    } else if (map && setDefault) {
      // If no accessory is selected, reset the map to the default center
      if (ZOOM_OUT_ICON) {
        const defaultCenter = {
          lat: 40.95499102071586,
          lng: -76.88504783841314,
        }
        map.setCenter(defaultCenter)
        map.setZoom(16)
      }
      shouldSetDefault(false)
      setRenderZoom(false)
    }
  }, [positions, map, selectedAccessoryId, accessoryColorAndIcon, setDefault])

  /**
   * Reset zoom back to default when deselecting off
   * the zoomed marker.
   *
   * Do not depend on initialLoad. Should not run
   * during loading.
   */
  useEffect(() => {
    if (selectedAccessoryId === null && initialLoad) {
      shouldSetDefault(true)
    }
  }, [selectedAccessoryId])

  /**
   * Get the historical data based on the selected accessory and
   * date and update the map with the markers.
   */
  const fetchDataAndUpdateMarkers = async () => {
    if (selectedAccessoryId !== null) {
      if (currentSelectedDays > 0) {
        setTimeout(() => {
          socket?.emit('get_history_data', {
            days: currentSelectedDays,
            device_id: selectedAccessoryId,
          })
        }, 5)
      } else {
        socket?.emit('get_latest_data', {
          device_id: selectedAccessoryId,
        })
      }
    } else {
      socket?.emit('get_latest_data', {
        all: true,
      })
    }
    setRefreshMap(prev => !prev)
  }

  /**
   * Fetch the latest data.
   */
  useEffect(() => {
    if (socket) {
      socket.on('latest_data_response', (data: any) => {
        if (data.error) {
          setLocationAndStatus(null)
          return
        }
        const updatedData = data.map((item: GeoData) => ({
          id: item.device_id || '',
          location: {
            lat: item.latitude,
            lng: item.longitude,
          },
          status: item.status,
          timestamp: item.timestamp,
        }))

        setLocationAndStatus(updatedData)
      })

      socket.emit('get_latest_data', { all: true })

      return () => {
        socket.off('latest_data_response')
      }
    }
  }, [socket])

  /**
   * Get the data positioning from the websocket.
   */
  useEffect(() => {
    if (socket) {
      socket.on('history_data_response', (data: any) => {
        if (data.error) {
          return
        }

        const positions = data.map((data: GeoData) => ({
          id: data.device_id,
          lat: data.latitude,
          lng: data.longitude,
        }))

        setPositions(positions)
      })

      socket.on('latest_data_response', (data: any) => {
        if (data.error) {
          setLocationAndStatus(null)
          return
        }

        const positions = data.map((data: GeoData) => ({
          id: data.device_id,
          lat: data.latitude,
          lng: data.longitude,
        }))

        setPositions(positions)
      })
    }

    return () => {
      if (socket) {
        socket.off('history_data_response')
        socket.off('latest_data_response')
      }
    }
  }, [socket, setLocationAndStatus])

  /**
   * Poll the websocket until it connects
   * while sending the request to display
   * markers.
   */
  useEffect(() => {
    const checkSocketConnection = () => {
      if (socket?.connected && !isButtonClicked) {
        clearInterval(pollingInterval)
        fetchDataAndUpdateMarkers()
      }
    }

    const pollingInterval = setInterval(checkSocketConnection, 10)

    return () => {
      clearInterval(pollingInterval)
    }
  }, [socket, isButtonClicked, fetchDataAndUpdateMarkers])

  /**
   * Fetch historical data.
   */
  useEffect(() => {
    fetchDataAndUpdateMarkers()
  }, [selectedAccessoryId, selectedDays, isButtonClicked])

  /**
   * Update the current selected days reference.
   */
  useEffect(() => {
    setSelectedDays(selectedDays)
  }, [selectedDays])

  // Initialize the map
  useEffect(() => {
    if (isLoaded && !map && mapRef.current) {
      const mapType = isSatellite ? 'satellite' : 'roadmap'
      const googleMap = new google.maps.Map(mapRef.current, {
        center: { lat: 40.95499102071586, lng: -76.88504783841314 }, // Default center
        zoom: 16,
        disableDefaultUI: true,
        mapTypeId: mapType,
        mapId: 'DEMO_MAP_ID',
      })
      setMap(googleMap)
      setInitialLoad(true)
    }
  }, [isLoaded, map, isSatellite])

  /**
   * Switch between satellite view and road map.
   */
  useEffect(() => {
    if (map) {
      const mapType = isSatellite ? 'satellite' : 'roadmap'
      map.setMapTypeId(mapType)
    }
  }, [isSatellite, map])

  /**
   * Map controls for zoom out.
   */
  const zoomIn = () => {
    if (map) {
      let newZoomLevel = map.getZoom()
      if (newZoomLevel !== undefined) map.setZoom(newZoomLevel + 1)
    }
  }

  /**
   * Map controls for zoom out
   */
  const zoomOut = () => {
    if (map) {
      let newZoomLevel = map.getZoom()
      if (newZoomLevel !== undefined) map.setZoom(newZoomLevel - 1)
    }
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>
  }

  return (
    <>
      <div
        ref={mapRef}
        style={{ height: 'calc(100vh - 55px)', width: '100%' }}
      />
      <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} />
    </>
  )
}

export default Map
