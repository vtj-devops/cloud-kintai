import { Stack } from "@mui/material";
import Link from "@shared/ui/link/Link";

const MENU_ITEMS = [
  {
    label: "スタッフ管理",
    href: "/admin/staff",
  },
  {
    label: "勤怠管理",
    href: "/admin/attendance",
  },
] as const;

const Menu = () => (
  <Stack
    component="nav"
    direction="row"
    alignItems="center"
    spacing={2}
    className="h-full w-auto box-border"
  >
    {MENU_ITEMS.map(({ label, href }) => (
      <div key={href}>
        <Link
          label={label}
          href={href}
          color="secondary"
          className="block h-full px-1 leading-8"
        />
      </div>
    ))}
  </Stack>
);

export default Menu;
