import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#FDECEE" },
          100: { value: "#FBD2D8" },
          200: { value: "#F3A3AE" },
          300: { value: "#E9748A" },
          400: { value: "#DA4A66" },
          500: { value: "#BB243E" },
          600: { value: "#9E1E34" },
          700: { value: "#7E182A" },
          800: { value: "#5F1220" },
          900: { value: "#3F0C16" },
          950: { value: "#26070D" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.600}" },
          contrast: { value: "{colors.brand.50}" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.100}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.600}" },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, customConfig)
