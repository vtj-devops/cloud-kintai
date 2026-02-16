import { Box, Container, Typography } from "@mui/material";
import type { StoryObj } from "@storybook/react";

const meta = {
  title: "Widgets/Layout/Header",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "アプリケーション共通ヘッダー。認証情報とテーマ設定に依存するため、Storybookでは基本的なレイアウトのみを表示します。",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Header コンポーネントは複数の Context と Redux に依存するため、
// Storybook では簡略版を表示
export const Info: Story = {
  render: () => (
    <Box>
      <Box
        sx={{
          backgroundColor: "#0FA85E",
          color: "white",
          p: 2,
          minHeight: "48px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="body2">
            Header Widget は AppConfigContext と AuthContext に依存しています
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary">
            ヘッダーは以下を含みます：
          </Typography>
          <ul>
            <li>ロゴ</li>
            <li>統合ナビゲーション（デスクトップ/モバイルを内包）</li>
            <li>外部リンク</li>
            <li>サインイン/アウトボタン</li>
          </ul>
          <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
            関連コンポーネント: src/widgets/layout/header/Header.tsx
          </Typography>
        </Box>
      </Container>
    </Box>
  ),
};
