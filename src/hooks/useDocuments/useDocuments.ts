import { useEffect, useState } from "react";

import { CreateDocumentInput, Document as APIDocument } from "../../API";
import createDocumentData from "./createDocumentData";
import fetchDocuments from "./fetchDocuments";

export default function useDocuments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<APIDocument[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDocuments()
      .then(setDocuments)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const createDocument = async (input: CreateDocumentInput) =>
    createDocumentData(input)
      .then((res) => setDocuments((prev) => [...prev, res]))
      .catch(setError);

  return {
    loading,
    error,
    documents,
    createDocument,
  };
}
