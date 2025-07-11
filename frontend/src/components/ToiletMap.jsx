import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Исправляем иконку маркера, т.к. Leaflet по умолчанию не отображает маркеры в React
const DefaultIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function ToiletMap({ toilets }) {
  // Центрируем карту на первый туалет или на Москву, если пусто
  const center = toilets.length > 0
    ? toilets[0].point.split(",").map(Number)
    : [55.751244, 37.618423]; // Москва

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {toilets.map((t) => {
        const [lat, lng] = t.point.split(",").map(Number);
        return (
          <Marker key={t.id} position={[lat, lng]}>
            <Popup>
              <b>{t.name}</b><br />
              ID: {t.id}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
