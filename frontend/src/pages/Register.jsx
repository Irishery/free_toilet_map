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

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password) {
      showNotification({ color: "red", message: "Введите имя и пароль" });
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Ошибка регистрации");

      showNotification({ color: "green", message: "Пользователь создан" });
      
      // Redirect to login page after successful registration
      navigate("/login");
    } catch (error) {
      showNotification({ color: "red", message: error.message });
    }
  };

  return (
    <Container size="xs" style={{ padding: '20px' }}>
      <Paper padding="xl" radius="md" shadow="xs" withBorder style={{ width: '100%' }}>
        <Title order={2} align="center" mb="xl" style={{ color: '#2C3E50' }}>Регистрация</Title>
        
        <Group direction="column" spacing="sm" grow>
          <TextInput
            label="Имя пользователя"
            placeholder="Введите ваше имя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ borderRadius: '8px' }}
          />
          <PasswordInput
            label="Пароль"
            placeholder="Введите ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ borderRadius: '8px' }}
          />
          
          <Button
            fullWidth
            onClick={handleRegister}
            style={{
              background: '#3498db',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Зарегистрироваться
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}
