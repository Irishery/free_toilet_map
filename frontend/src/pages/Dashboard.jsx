import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../hooks/useAuth";
import { parseJwt } from "../utils";
import MapContainer from "../components/ToiletMap";
import { ModalAddToilet } from "../components/ModalAddToilet";
import { ModalContent } from "../components/ModalContent";
import { useGeolocation } from "../hooks/useGeolocation";

export default function Dashboard() {
  const { token, logout } = useAuth();
  const { position, error: geoError } = useGeolocation();
  const [toilets, setToilets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setError] = useState("");
  const [activeToilet, setActiveToilet] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Проверка токена и его валидности
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const decodedToken = parseJwt(token);
    if (!decodedToken || decodedToken.exp * 1000 < Date.now()) {
      logout();
      window.location.href = "/login";
      return;
    }

    setUserId(decodedToken.user_id);
  }, [token, logout]);

  // Загружаем список туалетов
  useEffect(() => {
    api
      .get("/toilets")
      .then((res) => setToilets(res.data))
      .catch(() => setError("Не удалось загрузить туалеты"))
      .finally(() => setLoading(false));
  }, []);

  // Открыть модальное окно для добавления нового туалета
  const handleAddToilet = (lat, lng, address) => {
    setModalContent({
      type: "add",
      lat,
      lng,
      address,
    });
    setShowModal(true);
  };

  // Добавление нового туалета
  const submitNewToilet = async (
    name,
    lat,
    lng,
    address,
    toiletGender,
    toiletType
  ) => {
    try {
      const response = await api.post(
        "/toilet/add",
        {
          name,
          point: `${lat},${lng}`,
          gender: toiletGender,
          type: toiletType,
          address: address,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const toilet = {
        ...response.data,
        point: response.data.point ?? `${lat},${lng}`,
        founder_id: response.data.founder_id ?? userId,
        id: response.data.id ?? Date.now(),
      };

      setToilets((prev) => [...prev, toilet]);
      setShowModal(false);
    } catch (error) {
      setError("Ошибка при добавлении туалета: " + error.message);
    }
  };

  // Удаление туалета
  const deleteToilet = async (id) => {
    try {
      await api.delete("/toilet/delete", {
        data: { id },
        headers: { Authorization: `Bearer ${token}` },
      });

      setToilets((prev) => prev.filter((t) => t.id !== id));
      setShowModal(false);
    } catch (error) {
      setError("Не удалось удалить туалет: " + error.message);
    }
  };

  // Открытие модального окна с деталями туалета
  const openToiletModal = (toilet) => {
    setActiveToilet(toilet);
    setModalContent({
      type: "details",
      toilet,
    });
    setShowModal(true);
  };

  // Отправка отзыва о туалете
  const submitReview = async (toiletId, title, text, score) => {
    if (!title || !text || score === null) return;
    try {
      await api.post(
        "/review/add",
        {
          toilet_id: toiletId,
          title,
          review_text: text,
          score,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowModal(false);
      setActiveToilet(null);
    } catch (error) {
      setError("Ошибка при отправке отзыва: " + error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveToilet(null);
    setModalContent(null);
  };

  // Функция для обработки клика вне модального окна
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Функция для центрирования карты по местоположению
  const centerOnLocation = () => {
    if (position && mapInstance) {
      mapInstance.setView([position.lat, position.lng], 15);
    }
  };

  // Предотвращение закрытия при нажатии Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  return (
    <div className="w-full h-screen relative">
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white bg-opacity-80 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
              <span>Загрузка...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error messages */}
      {(errorMsg || geoError) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
            <strong className="font-bold">Ошибка! </strong>
            <span className="block sm:inline">{errorMsg || geoError}</span>
          </div>
        </div>
      )}

      {/* Map container with location button */}
      <div className="w-full h-full relative">
        {!loading && !errorMsg && (
          <MapContainer
            toilets={toilets}
            position={position}
            onToiletClick={openToiletModal}
            onAddToilet={handleAddToilet}
            setMapInstance={setMapInstance}
          />
        )}

        {/* Location center button - теперь внутри контейнера карты */}
        {position && (
          <button
            onClick={centerOnLocation}
            className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-3 rounded-full shadow-lg z-40 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            title="Центрировать по моему местоположению"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Custom Modal */}
      {showModal && modalContent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {modalContent.type === "add"
                    ? "Добавить новый туалет"
                    : `Туалет: ${modalContent.toilet?.name}`}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="mt-4">
                {modalContent.type === "add" ? (
                  <ModalAddToilet
                    lat={modalContent.lat}
                    lng={modalContent.lng}
                    onSubmit={(name, toiletType, toiletGender) =>
                      submitNewToilet(
                        name,
                        modalContent.lat,
                        modalContent.lng,
                        modalContent.address,
                        toiletType,
                        toiletGender
                      )
                    }
                    onClose={closeModal}
                  />
                ) : (
                  <ModalContent
                    toilet={modalContent.toilet}
                    userId={userId}
                    onSubmit={(title, text, score) =>
                      submitReview(modalContent.toilet.id, title, text, score)
                    }
                    onDelete={() => deleteToilet(modalContent.toilet.id)}
                    onClose={closeModal}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
