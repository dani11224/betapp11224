import React from "react";
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Icon name="sports-soccer" size={100} color="#290303ff" />
      </View>
      <TextInput style={styles.introducir_datos} placeholder="User" />
      <TextInput style={styles.introducir_datos} placeholder="Password" />
      <TouchableOpacity style={styles.boton_de_texto}>
        <Text style={styles.texto_boton}>Forgot Password?</Text>
      </TouchableOpacity>
      <View style={styles.boton_iniciar_sesion}>
        <Button title="Login" />
      </View>
      <Text style={styles.text}>Or login with</Text>
      <View style={{ marginTop: 10 }}>
        <Icon name="delete" size={30} color="#000" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#032234ff",
  },
  text: {
    fontSize: 14,
    color: "#eff4f7ff",
    paddingVertical: 16,
  },
  introducir_datos: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#000000ff",
    width: "80%",
    textShadowColor: "#000000",
    borderRadius: 20,
  },
  boton_iniciar_sesion: {
    backgroundColor: "#290303ff",
    textShadowColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  texto_boton: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0000000ff",
  },
  boton_de_texto: {
    paddingVertical: 0,
    paddingHorizontal: 50,
    borderRadius: 25,
    backgroundColor: "#032234ff",
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  logo: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
  }
});