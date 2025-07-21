import { useState, useRef, useEffect } from "react";
import { Container, Title, TextInput, PasswordInput, Button, Paper, Group, Text, Anchor, Loader } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);  // Loading state for the button
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const handleLogin = async () => {
    const apiUrl = process.env.VITE_API_URL || "http://localhost:8080";

    if (!username || !password) {
      showNotification({ color: "red", message: "Введите имя и пароль" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error("Ошибка входа");

      const data = await res.json();

      // Save the token to localStorage
      localStorage.setItem("token", data.token);

      // Explicitly clear the 3D model before navigating
      if (canvasRef.current) {
        canvasRef.current = null; // Clear the reference
      }

      // Redirect to dashboard after successful login
      navigate("/dashboard");
    } catch (error) {
      showNotification({ color: "red", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Set black background
    scene.background = new THREE.Color(0x000000);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // Load the toilet model using GLTFLoader
    const loader = new GLTFLoader();
    let toilet;
    loader.load(
      '/models/toilet.glb', // Ensure this path is correct
      (gltf) => {
        toilet = gltf.scene;
        scene.add(toilet);
        toilet.scale.set(2, 2, 2); // Adjust size of the model
      },
      undefined,
      (error) => {
        console.error('GLTF Model Loading Error:', error);
        showNotification({ color: 'red', message: 'Error loading the 3D model.' });
      }
    );

    // Set camera position
    camera.position.z = 5;

    // Handle window resize
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Animate the scene
    const animate = function () {
      requestAnimationFrame(animate);

      if (toilet) {
        // Make the model float by rotating and slightly moving it in space
        toilet.rotation.y += 0.01; // Rotate the model for dynamic movement
        toilet.position.x = Math.sin(toilet.rotation.y) * 2; // Horizontal oscillation (floating effect)
        toilet.position.y = Math.cos(toilet.rotation.y) * 2; // Vertical oscillation (floating effect)
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);

      // Dispose of geometry and material to avoid memory leaks
      if (toilet) {
        toilet.traverse((child) => {
          if (child.isMesh) {
            child.geometry.dispose();
            if (child.material.isMaterial) {
              child.material.dispose();
            }
          }
        });
      }

      // Ensure renderer and scene are cleaned up
      renderer.dispose();
      scene.clear(); // Remove all objects from the scene
      if (canvasRef.current) {
        canvasRef.current.remove(); // Remove canvas element
      }
    };
  }, []); // Empty dependency array ensures this effect runs once when the component mounts

  return (
    <div style={{ position: "relative", display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, zIndex: -1 }} />
      
      <Container className="signin" size="xs" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', padding: '20px' }}>
        <Paper padding="xl" radius="md" shadow="xs" style={{ width: '100%' }}>
          <Title order={2} align="center" mb="xl" style={{ color: 'white' }}>Войти</Title>
          
          <Group className="signinInputs" style={{ display: 'flex', flexDirection: 'column'}} direction="column" spacing="sm" grow>
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
            <Group position="apart" align="center" mb="md">
              <Anchor component="button" type="button" onClick={() => navigate("/register")}>
                Регистрация
              </Anchor>
            </Group>
            <Button
              fullWidth
              onClick={handleLogin}
              loading={loading}
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
              Войти
            </Button>
          </Group>
        </Paper>
      </Container>
    </div>
  );
}
