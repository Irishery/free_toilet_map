export function RatingAndReviews({ reviews }) {
  const reviewList = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="max-h-80 overflow-y-auto pr-4">
      {reviewList.length > 0 ? (
        reviewList.map((review, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-3 last:mb-0"
          >
            <h4 className="font-medium text-gray-900">{review.title}</h4>
            <p className="text-sm text-gray-700 my-3">{review.review_text}</p>
            <p className="text-sm text-gray-500">Оценка: {review.score}</p>
            <p className="text-xs text-gray-500 mt-3">
              <strong>Дата отзыва:</strong>{" "}
              {new Date(review.created_at).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <p className="text-gray-600 italic">Нет отзывов</p>
      )}
    </div>
  );
}
