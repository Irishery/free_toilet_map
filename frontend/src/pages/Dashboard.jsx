import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import {
  Container,
  Title,
  Loader,
  Alert,
  Text,
  TextInput,
  Textarea,
  Button,
  Stack,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../api";
import { useAuth } from "../hooks/useAuth";

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

export default function Dashboard() {
  const { token } = useAuth();
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/toilets")
      .then((res) => setToilets(res.data))
      .catch(() => setError("Не удалось загрузить туалеты"))
      .finally(() => setLoading(false));
  }, []);

  const openToiletModal = (toilet) => {
    modals.open({
      title: `Туалет: ${toilet.name}`,
      size: "lg",
      centered: true,
      children: (
        <ModalContent
          toilet={toilet}
          onSubmit={(title, text) =>
            submitReview(toilet.id, title, text, modals.closeAll)
          }
        />
      ),
    });
  };

  const submitReview = async (toiletId, title, text, onSuccess) => {
    if (!title || !text) return;

    try {
      await api.post(
        "/review/add",
        {
          toilet_id: toiletId,
          title,
          review_text: text,
          score: 5,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onSuccess?.();
    } catch {
      alert("Ошибка при отправке отзыва");
    }
  };

  return (
    <Container fluid p="md">
      <Title order={2} mb="md">Карта туалетов</Title>

      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && !error && (
        <MapContainer center={[55.75, 37.61]} zoom={12} style={{ height: 600 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {toilets.map((toilet) => {
            const [lat, lng] = toilet.point.split(",").map(parseFloat);
            return (
              <Marker
                key={toilet.id}
                position={[lat, lng]}
                eventHandlers={{
                  click: () => openToiletModal(toilet),
                }}
              >
                <Popup>{toilet.name}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </Container>
  );
}

// Компонент формы модалки
function ModalContent({ toilet, onSubmit }) {
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  return (
    <Stack>
      <Text size="sm" color="dimmed">
        Координаты: {toilet.point}
      </Text>

      <TextInput
        label="Заголовок отзыва"
        placeholder="Например: Чисто и удобно"
        value={reviewTitle}
        onChange={(e) => setReviewTitle(e.currentTarget.value)}
      />

      <Textarea
        label="Текст отзыва"
        placeholder="Напишите подробнее..."
        value={reviewText}
        onChange={(e) => setReviewText(e.currentTarget.value)}
        autosize
        minRows={3}
      />

      <Button fullWidth onClick={() => onSubmit(reviewTitle, reviewText)}>
        Отправить отзыв
      </Button>
    </Stack>
  );
}
