import { RxDBContext } from "../context/rxdb-context";
import { useQuery } from "@tanstack/react-query";
import { createRxDatabase } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import type { PropsWithChildren } from "react";
import ErrorScreen from "../components/error-screen";
import type { AppRxDatabase } from "../rxdb/rxdb";
import { connectionSchemaLiteral } from "../rxdb/connection";
import LoadingScreen from "../components/loading-screen";

export default function RxDBProvider({ children }: PropsWithChildren) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["RXDB"],
    queryFn: async () => {
      const rxDb = await createRxDatabase<AppRxDatabase>({
        name: "iot-commander",
        storage: wrappedValidateAjvStorage({
          storage: getRxStorageDexie(),
        }),
        closeDuplicates: true,
      });

      await rxDb.addCollections({
        connections: {
          schema: connectionSchemaLiteral,
        },
      });

      return rxDb;
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <LoadingScreen></LoadingScreen>;

  if (isError) {
    console.error(error);
    return <ErrorScreen></ErrorScreen>;
  }

  return (
    <RxDBContext.Provider
      value={{
        rxdb: data!,
      }}
    >
      {children}
    </RxDBContext.Provider>
  );
}
