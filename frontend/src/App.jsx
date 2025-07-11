import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Container, Button, TextInput, Title, Notification } from "@mantine/core";

// Заглушка: вместо настоящей авторизации — состояние loggedIn
function useAuth() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  return { loggedIn, login: () => setLoggedIn(true), logout: () => setLoggedIn(false) };
}

// Защищенный роут — если не авторизован, редиректит на логин
function ProtectedRoute({ children, loggedIn }) {
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LoginPage({ login }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    setError("");
    if (!username || !password) {
      setError("Введите имя пользователя и пароль");
      return;
    }
    // Здесь можно добавить запрос к бэку для проверки логина
    // Для примера просто логинимся всегда
    login();
    navigate("/");
  };

  return (
    <Container size="xs" mt="xl">
      <Title order={2} mb="md">Вход в систему</Title>
      <TextInput
        label="Имя пользователя"
        value={username}
        onChange={(e) => setUsername(e.currentTarget.value)}
        mb="sm"
      />
      <TextInput
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        mb="sm"
      />
      <Button fullWidth onClick={handleSubmit}>Войти</Button>
      {error && <Notification color="red" mt="md">{error}</Notification>}
    </Container>
  );
}

function MainPage() {
  return (
    <Container>
      <Title order={1}>Главная страница (Защищённая)</Title>
      {/* Здесь твоя карта и контент */}
    </Container>
  );
}

export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute loggedIn={auth.loggedIn}>
            <MainPage />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage login={auth.login} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
