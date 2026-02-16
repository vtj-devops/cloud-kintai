import { Box, Stack } from "@mui/material";
import HeaderBar from "@shared/ui/header/HeaderBar";
import type { Meta, StoryObj } from "@storybook/react";

// シンプルなロゴコンポーネント
const MockLogo = () => (
  <Box sx={{ fontWeight: "bold", color: "white", fontSize: "18px" }}>Logo</Box>
);

// シンプルなナビゲーションコンポーネント
const MockNavigation = () => (
  <Stack direction="row" spacing={2} sx={{ color: "white" }}>
    <Box sx={{ cursor: "pointer" }}>Menu 1</Box>
    <Box sx={{ cursor: "pointer" }}>Menu 2</Box>
    <Box sx={{ cursor: "pointer" }}>Menu 3</Box>
  </Stack>
);

// シンプルなボタン
const MockSignInOutButton = () => (
  <Box
    sx={{
      px: 2,
      py: 1,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: "4px",
      color: "white",
      cursor: "pointer",
    }}
  >
    Sign In
  </Box>
);

const meta = {
  title: "Shared UI/Layout/HeaderBar",
  component: HeaderBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    themeColor: {
      control: "color",
      description: "ヘッダーの背景色（デフォルト: グリーン）",
    },
  },
} satisfies Meta<typeof HeaderBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    logo: <MockLogo />,
    navigation: <MockNavigation />,
    signInOutButton: <MockSignInOutButton />,
  },
};

export const CustomThemeColor: Story = {
  args: {
    themeColor: "#1976d2",
    logo: <MockLogo />,
    navigation: <MockNavigation />,
    signInOutButton: <MockSignInOutButton />,
  },
};

export const WithExternalLinks: Story = {
  args: {
    logo: <MockLogo />,
    navigation: <MockNavigation />,
    externalLinks: (
      <Stack direction="row" spacing={1} sx={{ color: "white" }}>
        <Box sx={{ cursor: "pointer", fontSize: "14px" }}>GitHub</Box>
        <Box sx={{ cursor: "pointer", fontSize: "14px" }}>Docs</Box>
      </Stack>
    ),
    signInOutButton: <MockSignInOutButton />,
  },
};
