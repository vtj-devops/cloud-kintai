import "./index.css";

import { Authenticator } from "@aws-amplify/ui-react";
import { ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Amplify, I18n } from "aws-amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";

import { store } from "./app/store";
import config from "./aws-exports";
import { theme } from "./lib/theme";
import reportWebVitals from "./reportWebVitals";
import router from "./router";
import vocabularies from "./vocabularies";

Amplify.configure(config);

I18n.putVocabularies(vocabularies);
I18n.setLanguage("ja");

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Authenticator.Provider>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <RouterProvider router={router} />
          </LocalizationProvider>
        </ThemeProvider>
      </Authenticator.Provider>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
