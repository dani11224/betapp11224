import { Stack } from "expo-router";
 
export default function LayoutAuth() {
    return (
        <Stack
        screenOptions={{
            headerShown: false
        }}
        >
            <Stack.Screen name = "login"/>
            <Stack.Screen name = "register"/>
            <Stack.Screen name = "Cambiar_contra"/>
        </Stack>
    )
}
 