import React, { useRef, useEffect, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View'; // eslint-disable-line no-unused-vars
import Overlay from 'ol/Overlay'; // NEW: Import Overlay for tooltips
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Fill, Circle, Text } from 'ol/style';

const RouteMap = ({ visits }) => {
  const mapElement = useRef();
  const tooltipElement = useRef(); // NEW: Ref for the tooltip div
  const [map, setMap] = useState(null);
  
  // Style untuk garis rute (dibungkus dengan useCallback)
  const routeStyle = useCallback(() => new Style({
      stroke: new Stroke({
        color: '#007bff',
        width: 4,
      }),
    }), []);
  
    // Fungsi untuk membuat style marker dengan nomor urutan (dibungkus dengan useCallback)
    const createMarkerStyle = useCallback((number) => {
      return new Style({
        image: new Circle({
          radius: 15,
          fill: new Fill({ color: '#dc3545' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new Text({
          text: number.toString(),
          fill: new Fill({ color: '#fff' }),
          font: 'bold 12px sans-serif',
        }),
      });
    }, []);

  // Inisialisasi peta saat komponen pertama kali dimuat
  useEffect(() => {
    // NEW: Create an overlay for the tooltip
    const tooltip = new Overlay({
      element: tooltipElement.current,
      offset: [15, 0],
      positioning: 'center-left',
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      overlays: [tooltip], // NEW: Add the tooltip overlay to the map
      view: new View({
        center: fromLonLat([118.015776, -2.600029]), // Center of Indonesia
        zoom: 5,
      }),
    });
    setMap(initialMap);

    // --- NEW: Add pointermove event listener for tooltips ---
    initialMap.on('pointermove', (evt) => {
      if (evt.dragging) {
        tooltip.setPosition(undefined);
        return;
      }
      const feature = initialMap.forEachFeatureAtPixel(evt.pixel, (f) => f);
      
      if (feature && feature.get('type') === 'marker') {
        const salesName = feature.get('salesName');
        if (salesName) {
          tooltipElement.current.innerHTML = salesName;
          tooltip.setPosition(evt.coordinate);
        } else {
          tooltip.setPosition(undefined);
        }
      } else {
        tooltip.setPosition(undefined);
      }
    });


    return () => initialMap.dispose();
  }, []);

  // Update peta setiap kali data 'visits' berubah
  useEffect(() => {
    if (!map || !visits) return;

    // Hapus layer vektor yang lama jika ada
    map.getLayers().getArray()
      .filter(layer => layer instanceof VectorLayer)
      .forEach(layer => map.removeLayer(layer));

    if (visits.length === 0) {
        // Jika tidak ada kunjungan, reset view ke default
        map.getView().animate({
            center: fromLonLat([118.015776, -2.600029]),
            zoom: 5,
            duration: 500
        });
        return;
    }

    const coordinates = visits.map(visit =>
      fromLonLat([visit.customer.location.longitude, visit.customer.location.latitude])
    );

    // Buat fitur marker untuk setiap titik
    const markerFeatures = coordinates.map((coord, index) => {
      const visit = visits[index];
      const feature = new Feature({
        geometry: new Point(coord),
        type: 'marker', // Add a type to identify markers
        salesName: visit.user?.name || 'Nama Sales Tidak Tersedia', // Attach sales name
      });
      feature.setStyle(createMarkerStyle(index + 1)); // Gunakan fungsi yang sudah di-memoize
      return feature;
    });

    // Buat fitur garis rute
    const routeFeature = new Feature({
      geometry: new LineString(coordinates),
      type: 'route', // Add a type to identify the route line
    });
    routeFeature.setStyle(routeStyle()); // Panggil fungsi untuk mendapatkan style

    // Buat layer vektor baru
    const vectorSource = new VectorSource({
      features: [...markerFeatures, routeFeature],
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    map.addLayer(vectorLayer);

    // Zoom peta agar semua titik terlihat
    map.getView().fit(vectorSource.getExtent(), {
      padding: [50, 50, 50, 50],
      duration: 1000,
    });

  }, [map, visits, createMarkerStyle, routeStyle]); // Dijalankan ulang saat map atau visits berubah

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapElement} style={{ width: '100%', height: '500px', borderRadius: '8px' }}></div>
      {/* --- NEW: Tooltip Element --- */}
      <div ref={tooltipElement} className="route-tooltip"></div>
    </div>
  );
};

export default RouteMap;
