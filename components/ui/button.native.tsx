// components/ui/button.native.tsx
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Pressable, PressableProps, Text } from "react-native";

// Variantes RN (clases de NativeWind)
const buttonVariants = cva(
  "rounded-md items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary",
        destructive: "bg-destructive",
        outline: "border border-input bg-background",
        secondary: "bg-secondary",
        ghost: "",
        link: "",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

// 🔒 Deriva tipos no nulos para variant/size
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type RNButtonProps = Omit<PressableProps, "children"> & {
  className?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const textClassByVariant: Record<ButtonVariant, string> = {
  default: "text-primary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  secondary: "text-secondary-foreground",
  ghost: "text-foreground",
  link: "text-primary underline",
};

export default function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: RNButtonProps) {
  // 👇 asegura índices válidos
  const v: ButtonVariant = variant ?? "default";
  const s: ButtonSize = size ?? "default";

  const containerCls = cn(buttonVariants({ variant: v, size: s, className }));
  const textCls = textClassByVariant[v] ?? "text-foreground";

  return (
    <Pressable className={containerCls} {...props}>
      {typeof children === "string" ? (
        <Text className={cn("text-sm font-medium", textCls)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
