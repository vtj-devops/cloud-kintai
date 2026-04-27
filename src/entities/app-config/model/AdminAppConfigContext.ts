import { UpdateAppConfigInput } from "@shared/api/graphql/types";
import { createContext } from "react";

export type AdminAppConfigContextProps = {
  fetchAllConfigs: () => Promise<void>;
  deleteConfig: (configId: string) => Promise<void>;
  updateConfig: (
    configId: string,
    updatedConfig: UpdateAppConfigInput,
  ) => Promise<void>;
};

export const AdminAppConfigContext = createContext<AdminAppConfigContextProps>({
  fetchAllConfigs: async () => {
    throw new Error("AdminAppConfigContext.fetchAllConfigs is not implemented");
  },
  deleteConfig: async () => {
    throw new Error("AdminAppConfigContext.deleteConfig is not implemented");
  },
  updateConfig: async () => {
    throw new Error("AdminAppConfigContext.updateConfig is not implemented");
  },
});
