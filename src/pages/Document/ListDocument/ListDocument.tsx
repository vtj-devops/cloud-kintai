import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonIcon from "@mui/icons-material/Person";
import {
  Breadcrumbs,
  Chip,
  Grid,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

import useDocuments from "../../../hooks/useDocuments/useDocuments";
import { FilterGrid } from "./FilterGrid";
import { SearchGrid } from "./SearchGrid";

export default function ListDocument() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("すべて");

  const {
    documents,
    loading: documentLoading,
    error: documentError,
  } = useDocuments();

  if (documentLoading) {
    return <LinearProgress />;
  }

  if (documentError) return null;

  return (
    <>
      <Breadcrumbs>
        <Link href="/" color="inherit">
          TOP
        </Link>
        <Typography color="text.primary">ドキュメント一覧</Typography>
      </Breadcrumbs>
      <Grid container rowSpacing={{ xs: 2 }} columnSpacing={{ md: 2 }}>
        <SearchGrid setSearchKeyword={setSearchKeyword} />
        <FilterGrid
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />
        <AddDocumentGrid />
        {documents
          .filter((document) => document.title.includes(searchKeyword))
          .filter(
            (document) =>
              selectedRole === "すべて" ||
              document.targetRole?.includes(selectedRole)
          )
          .map((document, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Stack direction="column" spacing={2}>
                  <Link href={`/docs/${document.id}`}>
                    <Typography variant="body1">{document.title}</Typography>
                  </Link>
                  <Stack direction="row" spacing={1}>
                    {document.targetRole ? (
                      (() => {
                        const targetRole = document.targetRole.filter(
                          (item): item is NonNullable<typeof item> =>
                            item !== null
                        );

                        if (targetRole.length === 0) {
                          return (
                            <Chip
                              label={"すべて"}
                              icon={<PersonIcon fontSize="small" />}
                            />
                          );
                        }

                        return targetRole.map((role, i) => (
                          <Chip
                            label={role}
                            key={i}
                            icon={<PersonIcon fontSize="small" />}
                          />
                        ));
                      })()
                    ) : (
                      <Chip
                        label={"すべて"}
                        icon={<PersonIcon fontSize="small" />}
                      />
                    )}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
      </Grid>
    </>
  );
}

function AddDocumentGrid() {
  return (
    <Grid item xs={12} md={4}>
      <Link href="/docs/post">
        <Paper
          elevation={3}
          sx={{
            p: 3,
            height: {
              xs: 60,
              md: 120,
            },
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AddCircleIcon fontSize="large" color="success" />
        </Paper>
      </Link>
    </Grid>
  );
}
