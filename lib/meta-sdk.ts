/**
 * Meta JavaScript SDK Singleton Loader
 *
 * Ensures thread-safe, deduplicated loading of the Meta JS SDK script (connect.facebook.net/en_US/sdk.js)
 * and unified FB.init initialization with dynamic API version resolution (v22.0+).
 */

export interface InitMetaSdkOptions {
  appId: string;
  apiVersion?: string;
  autoLogAppEvents?: boolean;
  xfbml?: boolean;
}

declare global {
  interface Window {
    FB?: {
      init(params: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }): void;
      login(
        callback: (response: import("@/types/channels").FbLoginResponse) => void,
        options?: import("@/types/channels").FbLoginOptions
      ): void;
    };
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<NonNullable<typeof window.FB>> | null = null;
let currentAppId: string | null = null;

/**
 * Loads and initializes the Meta JavaScript SDK once per browser session.
 */
export function loadMetaSdk(options: InitMetaSdkOptions): Promise<NonNullable<typeof window.FB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Meta SDK can only be loaded in a browser environment"));
  }

  if (!options.appId) {
    return Promise.reject(new Error("Meta App ID is required to initialize Meta SDK"));
  }

  // If already initialized with the same App ID, return existing instance
  if (window.FB && currentAppId === options.appId) {
    return Promise.resolve(window.FB);
  }

  if (sdkPromise && currentAppId === options.appId) {
    return sdkPromise;
  }

  currentAppId = options.appId;

  sdkPromise = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      sdkPromise = null;
      currentAppId = null;
      reject(new Error("Meta SDK load timeout"));
    }, 15000);

    const initFB = () => {
      clearTimeout(timeoutId);
      try {
        if (!window.FB) {
          throw new Error("window.FB is not defined after script load");
        }
        window.FB.init({
          appId: options.appId,
          autoLogAppEvents: options.autoLogAppEvents ?? true,
          xfbml: options.xfbml ?? true,
          version: options.apiVersion || "v22.0",
        });
        resolve(window.FB);
      } catch (err) {
        sdkPromise = null;
        currentAppId = null;
        reject(err);
      }
    };

    if (window.FB) {
      initFB();
      return;
    }

    window.fbAsyncInit = function () {
      initFB();
    };

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        clearTimeout(timeoutId);
        sdkPromise = null;
        currentAppId = null;
        reject(new Error("Failed to load Meta SDK script from connect.facebook.net"));
      };
      document.body.appendChild(script);
    }
  });

  return sdkPromise;
}
