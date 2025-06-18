import React, { useEffect, useState } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { getRecipeImages } from "../services/api";

const WelcomeScreen = () => {
  const [backgroundImage, setBackgroundImage] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      const images = await getRecipeImages();
      if (images.length > 0) {
        setBackgroundImage(images[Math.floor(Math.random() * images.length)]); // 🔥 Choix aléatoire d'une image
      }
    };
    fetchImages();
  }, []);

  return (
    <ImageBackground source={{ uri: backgroundImage }} style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.title}>Bienvenue sur TchopTime ! 🍽️</Text>
        <Text style={styles.subtitle}>Planifiez, cuisinez et partagez vos repas facilement.</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: "cover", justifyContent: "center" },
  overlay: { backgroundColor: "rgba(0,0,0,0.5)", padding: 20, borderRadius: 10 },
  title: { color: "white", fontSize: 24, fontWeight: "bold", textAlign: "center" },
  subtitle: { color: "white", fontSize: 16, textAlign: "center" },
});

export default WelcomeScreen;
