import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  copyConnectionData,
  MqttContext,
  MqttContextInitialValue,
} from "../context/mqtt-context";
import type { ConnectionDocType } from "../rxdb/connection";
import mqtt from "mqtt";
import { toast, useOverlayState } from "@heroui/react";
import { SatelliteDish } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Constants } from "../constants";
import { RxDBContext } from "../context/rxdb-context";
import PasswordModal from "../components/connection/password-modal";

export default function MqttProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const { rxdb } = useContext(RxDBContext);
  const [connectionData, setConnectionData] = useState(
    MqttContextInitialValue.connectionData,
  );

  const passwordState = useOverlayState();

  const { data } = useQuery({
    queryKey: ["AUTO_CONNECT_PROVIDER"],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const id = localStorage.getItem(Constants.AUTO_CONNECT_STORAGE_KEY);
      if (!id) return null;
      const data = await rxdb.connections.findOne(id).exec();
      if (data && data.password) {
        mqttConnect(data, data.password);
      } else if (data && !data.password) {
        passwordState.open();
      }
      return data;
    },
  });

  const mqttConnect = useCallback(
    async (connection: ConnectionDocType, password?: string) => {
      if (connectionData) {
        await connectionData.client.endAsync();
      }

      const client = await mqtt.connect(connection.url, {
        username: connection.username || undefined,
        password: password || undefined,
        reconnectPeriod: 1000,
      });

      setConnectionData(() => ({
        client,
        isConnected: false,
        info: {
          id: connection.id,
          name: connection.name,
          url: connection.url,
          username: connection.username,
          password: connection.password,
          discoveryTopic: connection.discoveryTopic,
          responseDiscoveryTopic: connection.responseDiscoveryTopic,
          sleepyDeviceDiscoveryTopic: connection.sleepyDeviceDiscoveryTopic,
          sleepyDeviceResponseDiscoveryTopic:
            connection.sleepyDeviceResponseDiscoveryTopic,
        },
      }));
    },
    [connectionData],
  );

  const mqttDisconnect = useCallback(async () => {
    if (connectionData) {
      await connectionData.client.endAsync();
    }
    setConnectionData(() => null);
  }, [connectionData]);

  useEffect(() => {
    const handleConnect = () => {
      console.log("mqtt-context: connected");
      toast(t("connected"), {
        indicator: <SatelliteDish />,
        variant: "success",
      });

      setConnectionData((connectionData) => {
        console.log(connectionData);

        if (!connectionData) return null;
        return {
          ...copyConnectionData(connectionData),
          isConnected: true,
        };
      });
    };
    const handleReconnect = () => {
      console.log("mqtt-context: reconnect");
      setConnectionData((connectionData) => {
        if (!connectionData) return null;
        return {
          ...copyConnectionData(connectionData),
          isConnected: false,
        };
      });
    };

    const handleDisconnect = () => {
      console.log("mqtt-context: disconnect");
      toast(t("disconnected"), {
        indicator: <SatelliteDish />,
        variant: "danger",
      });

      setConnectionData((connectionData) => {
        if (!connectionData) return null;
        return {
          ...copyConnectionData(connectionData),
          isConnected: false,
        };
      });
    };

    const handleError = () => {
      console.log("mqtt-context: error");
      toast(t("error"), {
        indicator: <SatelliteDish />,
        variant: "danger",
      });

      setConnectionData((connectionData) => {
        if (!connectionData) return null;
        connectionData.client.end(true);
        return null;
      });
    };

    if (connectionData) {
      connectionData.client.on("connect", handleConnect);
      connectionData.client.on("reconnect", handleReconnect);
      connectionData.client.on("disconnect", handleDisconnect);
      connectionData.client.on("error", handleError);
    }

    return () => {
      if (connectionData) {
        connectionData.client.removeListener("connect", handleConnect);
        connectionData.client.removeListener("reconnect", handleReconnect);
        connectionData.client.removeListener("disconnect", handleDisconnect);
        connectionData.client.removeListener("error", handleError);
      }
    };
  }, [connectionData, t]);

  return (
    <>
      <MqttContext.Provider
        value={{
          connectionData,
          setConnectionData,
          mqttConnect,
          mqttDisconnect,
        }}
      >
        {data && data.username ? (
          <PasswordModal
            state={passwordState}
            onSubmit={(password) => mqttConnect(data, password)}
          ></PasswordModal>
        ) : null}
        {children}
      </MqttContext.Provider>
    </>
  );
}
