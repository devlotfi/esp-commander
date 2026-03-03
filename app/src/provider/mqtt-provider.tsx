import {
  useCallback,
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
import { toast } from "@heroui/react";
import { SatelliteDish } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function MqttProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [connectionData, setConnectionData] = useState(
    MqttContextInitialValue.connectionData,
  );

  /* const openLoading = useCallback(() => {
    onOpenLoading();
    timeoutRef.current = setTimeout(() => {
      onCloseLoading();
      onOpenTimeout();
    }, 10000) as unknown as number;
  }, [onCloseLoading, onOpenLoading, onOpenTimeout]); */

  /* const closeLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onCloseLoading();
  }, [onCloseLoading]); */

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
          discoveryTopic: connection.discoveryTopic,
          responseDiscoveryTopic: connection.responseDiscoveryTopic,
          username: connection.username,
          password: connection.password,
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

      /* if (connectionData) {
        connectionData.client.subscribe(connectionData.responseTopic, (err) => {
          if (!err) console.log("Subscribed to ", connectionData.responseTopic);
        });
      } */
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
        {children}
      </MqttContext.Provider>
    </>
  );
}
