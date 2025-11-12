import React, { useRef, useEffect, useState } from 'react';
import './MapPicker.css';
import 'ol/ol.css'; // Import OpenLayers CSS

// OpenLayers imports
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector'; // eslint-disable-line no-unused-vars
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ'; // NEW: Import XYZ source for satellite tiles
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import markerIcon from '../assets/marker-icon.png'; // Pastikan path ini benar

const MapPicker = ({ latitude, longitude, onLocationChange }) => {
  const mapElement = useRef(); // Ref for the div element
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  // --- NEW: State for managing map layers and type ---
  const [streetLayer, setStreetLayer] = useState(null);
  const [satelliteLayer, setSatelliteLayer] = useState(null);
  const [mapType, setMapType] = useState('street'); // 'street' or 'satellite'

  // Effect 1: Initialize Map and Marker Objects (runs only once)
  useEffect(() => {
    const markerFeature = new Feature({
      geometry: new Point(fromLonLat([106.816666, -6.200000])), // Default to Jakarta
    });
    markerFeature.setStyle(new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: markerIcon,
        scale: 0.7,
      }),
    }));
    setMarker(markerFeature);

    // --- NEW: Define the two base layers ---
    const newStreetLayer = new TileLayer({
      source: new OSM(),
      visible: true, // Visible by default
    });
    setStreetLayer(newStreetLayer);

    const newSatelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri',
        maxZoom: 19,
      }),
      visible: false, // Hidden by default
    });
    setSatelliteLayer(newSatelliteLayer);

    const initialMap = new Map({
      layers: [
        newStreetLayer,
        newSatelliteLayer,
        new VectorLayer({
          source: new VectorSource({ features: [markerFeature] }),
        }),
      ],
      view: new View({
        center: fromLonLat([106.816666, -6.200000]),
        zoom: 13,
      }),
    });
    setMap(initialMap);

    return () => {
      initialMap.dispose();
    };
  }, []);

  // Effect 2: Connect Map to DOM and Add Event Listeners
  useEffect(() => {
    if (map && mapElement.current) {
      map.setTarget(mapElement.current);

      const clickHandler = (evt) => {
        const newCoords = toLonLat(evt.coordinate);
        onLocationChange(newCoords[1], newCoords[0]);
      };
      map.on('singleclick', clickHandler);

      return () => {
        map.un('singleclick', clickHandler);
      };
    }
  }, [map, onLocationChange]);

  // Effect 3: Update Marker and View when props change
  useEffect(() => {
    const numLat = parseFloat(latitude);
    const numLon = parseFloat(longitude);

    if (map && marker && !isNaN(numLat) && !isNaN(numLon)) {
      const newPosition = fromLonLat([numLon, numLat]);
      marker.getGeometry().setCoordinates(newPosition);
      map.getView().animate({ center: newPosition, zoom: 16, duration: 500 });
    }
  }, [map, marker, latitude, longitude]);

  // --- NEW: Function to toggle between map types ---
  const toggleMapType = () => {
    if (streetLayer && satelliteLayer) {
      if (mapType === 'street') {
        streetLayer.setVisible(false);
        satelliteLayer.setVisible(true);
        setMapType('satellite');
      } else {
        streetLayer.setVisible(true);
        satelliteLayer.setVisible(false);
        setMapType('street');
      }
    }
  };

  return (
    <div className="map-picker-card">
      <div ref={mapElement} className="map-container"></div>
      {/* --- NEW: Button to switch map layer --- */}
      <button type="button" onClick={toggleMapType} className="map-type-toggle">
        {mapType === 'street' ? 'Satelit' : 'Peta Jalan'}
      </button>
    </div>
  );
};

export default MapPicker;
