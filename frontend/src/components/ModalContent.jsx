import { useState, useEffect } from "react";
import ReactStars from "react-stars";
import api from "../api";
import { RatingAndReviews } from "../components/RatingAndReviews";

export function ModalContent({ toilet, userId, onSubmit, onDelete, onClose }) {
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [score, setScore] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get(`/toilet/${toilet.id}/reviews`);
        setReviews(response.data);
      } catch (err) {
        setError("Ошибка при загрузке отзывов");
        console.error(err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [toilet.id]);

  const isOwner = toilet.founder_id === userId;

  const confirmDelete = () => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите удалить этот туалет?"
    );
    if (confirmed) {
      onDelete();
    }
  };

  const handleSubmitReview = () => {
    onSubmit(reviewTitle, reviewText, score);
    setReviewTitle("");
    setReviewText("");
    setScore(0);
  };

  return (
    <div className="space-y-4">
      {/* Toilet information */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Координаты:</span> {toilet.point}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Гендер:</span>{" "}
          {toilet.gender === "male" ? "Мужской" : "Женский"}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Тип туалета:</span>{" "}
          {toilet.type === "free" ? "Бесплатный" : "Платный"}
        </p>
        {toilet.address && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Адрес:</span> {toilet.address}
          </p>
        )}
      </div>

      {/* Loading and error states */}
      {loadingReviews && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Загрузка отзывов...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Reviews */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Отзывы</h3>
        <RatingAndReviews reviews={reviews} />
      </div>

      {/* Review form */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Оставить отзыв</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заголовок отзыва
          </label>
          <input
            type="text"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите заголовок отзыва"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст отзыва
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Введите текст отзыва"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Оцените туалет:
          </label>
          <div className="flex items-center">
            <ReactStars
              count={5}
              value={score}
              onChange={setScore}
              size={24}
              color2="#ffd700"
            />
            <span className="ml-2 text-sm text-gray-600">{score}/5</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubmitReview}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Отправить отзыв
          </button>

          {isOwner && (
            <button
              onClick={confirmDelete}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Удалить туалет
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
