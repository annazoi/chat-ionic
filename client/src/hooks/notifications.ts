import { useEffect, useId } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { updateUser } from "../services/users";
import { useMutation } from "@tanstack/react-query";
import { authStore } from "../store/auth";

export const useNotifications = () => {
  const { userId } = authStore();
  const { mutate: updateUserMutate } = useMutation({
    mutationFn: (token: any) => updateUser(userId, token),
  });
  useEffect(() => {
    const isWeb = Capacitor.getPlatform() === "web";
    if (isWeb) return;
    registerNotifications();
    addListeners();
  }, []);

  const addListeners = async () => {
    await PushNotifications.addListener("registration", (token) => {
      console.log("id", userId);
      console.info("Registration token: ", token.value);
      updateUserMutate({ notificationToken: token.value });
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("Registration error: ", err.error);
    });

    await PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("Push notification received: ", notification);
      }
    );

    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log(
          "Push notification action performed",
          notification.actionId,
          notification.inputValue
        );
      }
    );
  };

  const registerNotifications = async () => {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
      }

      await PushNotifications.register();
    } catch (e) {
      alert(e);
    }
  };
};
