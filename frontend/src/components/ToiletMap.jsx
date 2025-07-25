import { useEffect, useState } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

// Custom icon for the user's current location
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/731/731610.png",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

function getAddressFromCoordinates(lat, lng, callback) {
  const apiKey = "462978eb457d480e9723dc9c42ab2ec6";
  const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.results.length > 0) {
        callback(data.results[0].formatted);
      } else {
        console.error("Адрес не найден");
      }
    })
    .catch((error) => console.error("Ошибка получения адреса:", error));
}

// MapClickHandler component to handle map clicks
export function MapClickHandler({ onClick }) {
  useMapEvent("click", onClick);
  return null;
}

// Custom hook to update map center and provide map instance
function SetMapCenter({ position, setMapInstance }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);

  useEffect(() => {
    if (setMapInstance) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  return null;
}

export default function MapComponent({
  toilets,
  position,
  onToiletClick,
  onAddToilet,
  setMapInstance,
}) {
  const [address, setAddress] = useState(null);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;

    getAddressFromCoordinates(lat, lng, (address) => {
      setAddress(address);
      onAddToilet(lat, lng, address);
    });
  };

  return (
    <div className="w-full h-full relative">
      <LeafletMapContainer
        center={[55.75, 37.61]}
        zoom={12}
        className="h-full w-full z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapClickHandler onClick={handleMapClick} />
        <SetMapCenter position={position} setMapInstance={setMapInstance} />

        {position && (
          <Marker position={[position.lat, position.lng]} icon={userIcon}>
            <Popup>Это ваша текущая локация</Popup>
          </Marker>
        )}

        {toilets && Array.isArray(toilets) && toilets.length > 0
          ? toilets.map((toilet) => {
              const point = toilet.point?.split(",").map(parseFloat);
              if (!point || point.length !== 2 || point.some(isNaN))
                return null;
              return (
                <Marker
                  key={toilet.id}
                  position={point}
                  eventHandlers={{ click: () => onToiletClick(toilet) }}
                />
              );
            })
          : null}
      </LeafletMapContainer>

      {/* Info message when no toilets */}
      {toilets && Array.isArray(toilets) && toilets.length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow-lg z-10">
          <p className="text-gray-700 font-medium">
            Нет туалетов для отображения.
          </p>
        </div>
      )}
    </div>
  );
}
