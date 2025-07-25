import { useState } from "react";

export function ModalAddToilet({ lat, lng, onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [toiletGender, setToiletGender] = useState("male");
  const [toiletType, setToiletType] = useState("free");

  const handleSubmit = () => {
    onSubmit(name, toiletGender, toiletType);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название туалета
        </label>
        <input
          type="text"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Гендер
        </label>
        <select
          value={toiletGender}
          onChange={(e) => setToiletGender(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Тип туалета
        </label>
        <select
          value={toiletType}
          onChange={(e) => setToiletType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="free">Бесплатный</option>
          <option value="paid">Платный</option>
        </select>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Добавить туалет
        </button>
        <button
          onClick={onClose}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
