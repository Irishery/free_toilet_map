import { useState } from "react";
import {
  Container,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Group,
  Text,
  Anchor,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      showNotification({ color: "red", message: "Введите имя и пароль" });
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Ошибка входа");

      const data = await res.json();

      // Сохраняем токен в localStorage
      localStorage.setItem("token", data.token);

      // Перенаправляем на страницу Dashboard
      navigate("/dashboard");
    } catch (error) {
      showNotification({ color: "red", message: error.message });
    }
  };

  return (
    <Container size={420} my={40}>
      <Paper p="xl" shadow="md" radius="md">
        <Title align="center" mb="md">Вход</Title>

        <TextInput
          label="Имя пользователя"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          required
          mb="sm"
        />
        <PasswordInput
          label="Пароль"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          required
          mb="md"
        />

        <Group position="apart" mb="md">
          <Text size="sm">
            Нет аккаунта?{" "}
            <Anchor href="/register" size="sm">Зарегистрироваться</Anchor>
          </Text>
        </Group>

        <Button fullWidth onClick={handleLogin}>
          Войти
        </Button>
      </Paper>
    </Container>
  );
}
