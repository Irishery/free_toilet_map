import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  // Получаем токен из localStorage
  const token = localStorage.getItem("token");

  // Если токен отсутствует, перенаправляем на страницу логина
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Проверим срок действия токена (например, если это JWT)
  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1])); // Декодируем JWT
    const expirationDate = new Date(decodedToken.exp * 1000); // Преобразуем время в миллисекунды

    // Если токен истёк, удаляем его из localStorage и перенаправляем на страницу логина
    if (expirationDate < new Date()) {
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    // Если ошибка при декодировании токена, тоже перенаправляем на страницу логина
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Если токен действителен, редиректим на Dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // Если все проверки прошли успешно, отдаем дочерние компоненты
  return children;
}
