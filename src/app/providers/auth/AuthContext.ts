import { AuthEventData, AuthStatus } from "@aws-amplify/ui";
import { CognitoUser } from "@entities/staff/model/useCognitoUser";
import { StaffRole } from "@entities/staff/model/useStaffs/useStaffs";
import type { AuthUser } from "aws-amplify/auth";
import { createContext } from "react";

export type SessionSnapshot = {
  user?: AuthUser;
  authStatus?: AuthStatus;
  cognitoUser?: CognitoUser | null;
  roles: StaffRole[];
};

export type AuthContextProps = {
  session?: SessionSnapshot;
  signOut: (data?: AuthEventData | undefined) => void;
  signIn: () => void;
  hasRole?: (role: StaffRole) => boolean;
  isCognitoUserRole: (role: StaffRole) => boolean;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  roles?: StaffRole[];
  user?: AuthUser;
  authStatus?: AuthStatus;
  cognitoUser?: CognitoUser | null;
};

export const AuthContext = createContext<AuthContextProps>({
  session: {
    roles: [],
  },
  signOut: () => {
    throw new Error("AuthContext.signOut is not implemented");
  },
  signIn: () => {
    throw new Error("AuthContext.signIn is not implemented");
  },
  hasRole: () => false,
  isCognitoUserRole: () => false,
  isAuthenticated: false,
  isLoading: false,
  roles: [],
});
